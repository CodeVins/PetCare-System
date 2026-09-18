package com.petcare.domain.chat;

import com.petcare.domain.chat.dto.ChatMessageCreateRequest;
import com.petcare.domain.chat.dto.ChatMessageResponse;
import com.petcare.domain.chat.dto.ChatRoomResponse;
import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.hospital.HospitalService;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

	private final ChatRoomRepository chatRoomRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final HospitalService hospitalService;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	@Transactional
	public ChatRoomResponse getOrCreateRoom(Long userId, Long hospitalId) {
		return chatRoomRepository.findByCustomerIdAndHospitalId(userId, hospitalId)
				.map(ChatRoomResponse::from)
				.orElseGet(() -> {
					Hospital hospital = hospitalService.findHospital(hospitalId);
					User customer = userRepository.getReferenceById(userId);
					ChatRoom room = ChatRoom.builder().customer(customer).hospital(hospital).build();
					return ChatRoomResponse.from(chatRoomRepository.save(room));
				});
	}

	public PageResponse<ChatRoomResponse> getMyRooms(User currentUser, Pageable pageable) {
		Page<ChatRoom> rooms = currentUser.getRole() == Role.HOSPITAL_OWNER
				? chatRoomRepository.findAllByHospital_OwnerId(currentUser.getId(), pageable)
				: chatRoomRepository.findAllByCustomerId(currentUser.getId(), pageable);
		return PageResponse.from(rooms.map(ChatRoomResponse::from));
	}

	public PageResponse<ChatMessageResponse> getMessages(User currentUser, Long roomId, Pageable pageable) {
		ChatRoom room = findRoom(roomId, currentUser);
		return PageResponse.from(
				chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(room.getId(), pageable)
						.map(ChatMessageResponse::from));
	}

	@Transactional
	public ChatMessageResponse sendMessage(User sender, Long roomId, ChatMessageCreateRequest request) {
		ChatRoom room = findRoom(roomId, sender);
		ChatMessage message = ChatMessage.builder().chatRoom(room).sender(sender).content(request.content()).build();
		ChatMessageResponse response = ChatMessageResponse.from(chatMessageRepository.save(message));

		Long recipientId = resolveRecipient(sender, room);
		if (recipientId != null) {
			notificationService.notify(
					recipientId, NotificationType.CHAT_MESSAGE_RECEIVED, sender.getEmail() + "님이 메시지를 보냈습니다.");
		}
		return response;
	}

	private Long resolveRecipient(User sender, ChatRoom room) {
		if (sender.getId().equals(room.getCustomer().getId())) {
			User owner = room.getHospital().getOwner();
			return owner != null ? owner.getId() : null;
		}
		return room.getCustomer().getId();
	}

	private ChatRoom findRoom(Long roomId, User currentUser) {
		ChatRoom room = chatRoomRepository.findById(roomId)
				.orElseThrow(() -> new NotFoundException("채팅방을 찾을 수 없습니다."));
		if (!room.canAccess(currentUser)) {
			throw new ForbiddenException("이 채팅방에 접근할 권한이 없습니다.");
		}
		return room;
	}
}
