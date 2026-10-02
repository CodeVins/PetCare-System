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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

	private final ChatRoomRepository chatRoomRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final HospitalService hospitalService;
	private final UserRepository userRepository;
	private final NotificationService notificationService;
	private final SimpMessagingTemplate messagingTemplate;
	private final SimpUserRegistry simpUserRegistry;

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
		boolean hospitalSide = currentUser.getRole() == Role.HOSPITAL_OWNER;
		Page<ChatRoom> rooms = hospitalSide
				? chatRoomRepository.findAllByHospital_OwnerId(currentUser.getId(), pageable)
				: chatRoomRepository.findAllByCustomerId(currentUser.getId(), pageable);
		// 변경(2026-10-02): 방마다 안 읽은 메시지 수 포함 — 페이지 단위로 쿼리 한 번 (이전: 방 정보만)
		List<Long> roomIds = rooms.map(ChatRoom::getId).toList();
		Map<Long, Long> unread = roomIds.isEmpty() ? Map.of()
				: (hospitalSide
						? chatMessageRepository.countUnreadForHospital(roomIds)
						: chatMessageRepository.countUnreadForCustomer(roomIds)).stream()
						.collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
		return PageResponse.from(rooms.map(room -> ChatRoomResponse.of(room, unread.getOrDefault(room.getId(), 0L))));
	}

	// 채팅방을 열었거나 열어둔 채 새 메시지를 받았을 때 프론트가 호출 — 지금까지의 메시지를 전부 읽음으로
	@Transactional
	public void markRead(User currentUser, Long roomId) {
		ChatRoom room = findRoom(roomId, currentUser);
		Long latestId = chatMessageRepository.findLatestId(room.getId());
		if (latestId != null) {
			room.markReadBy(currentUser, latestId);
		}
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

		// 변경(2026-10-02): 커밋 후 채팅방 구독자에게 WebSocket으로 메시지 자체를 push
		// (이전: 메시지는 안 보내고 알림 SSE만 → 프론트가 알림을 받으면 목록 전체 재조회, 채팅 알림을 끈 유저는 실시간 갱신이 안 됐음)
		String destination = ChatStompInterceptor.ROOM_TOPIC_PREFIX + room.getId();
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				messagingTemplate.convertAndSend(destination, response);
			}
		});

		// 변경(2026-10-02): 받는 사람이 지금 그 채팅방을 보고 있으면(구독 중) 알림 생략 (이전: 메시지마다 알림이 쌓임)
		User recipient = resolveRecipient(sender, room);
		if (recipient != null && !isWatching(recipient.getEmail(), destination)) {
			notificationService.notify(
					recipient.getId(), NotificationType.CHAT_MESSAGE_RECEIVED, sender.getEmail() + "님이 메시지를 보냈습니다.");
		}
		return response;
	}

	// SimpUserRegistry는 STOMP 연결 유저 이름(=이메일, CONNECT 때 세팅한 인증 객체)별 구독 목록을 메모리에 들고 있음
	private boolean isWatching(String email, String destination) {
		SimpUser user = simpUserRegistry.getUser(email);
		return user != null && user.getSessions().stream()
				.flatMap(session -> session.getSubscriptions().stream())
				.anyMatch(subscription -> destination.equals(subscription.getDestination()));
	}

	// 변경(2026-10-02): id 대신 User 반환 — 구독 여부 확인에 이메일도 필요 (이전: Long recipientId)
	private User resolveRecipient(User sender, ChatRoom room) {
		if (sender.getId().equals(room.getCustomer().getId())) {
			return room.getHospital().getOwner();
		}
		return room.getCustomer();
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
