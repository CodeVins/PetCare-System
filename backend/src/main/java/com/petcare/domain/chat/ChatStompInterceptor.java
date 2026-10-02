package com.petcare.domain.chat;

import com.petcare.global.security.CustomUserDetails;
import com.petcare.global.security.CustomUserDetailsService;
import com.petcare.global.security.JwtTokenProvider;
import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

/**
 * STOMP 프레임 단위 인증·인가. HTTP 핸드셰이크(/api/ws)는 permitAll이라 여기서 막아야 함.
 * - CONNECT: Authorization: Bearer 헤더의 JWT 검증, 정지 계정 거부 (JwtAuthenticationFilter와 같은 규칙)
 * - SUBSCRIBE: /topic/chat-rooms/{roomId}만, ChatRoom.canAccess()로 재검증
 * - SEND: 전부 거부 — 메시지 전송은 REST로만 받음. 안 막으면 클라이언트가 /topic에 직접 보내 다른 사람 행세 가능
 */
@Component
@RequiredArgsConstructor
public class ChatStompInterceptor implements ChannelInterceptor {

	public static final String ROOM_TOPIC_PREFIX = "/topic/chat-rooms/";
	private static final Pattern ROOM_TOPIC = Pattern.compile("^/topic/chat-rooms/(\\d+)$");
	private static final String BEARER = "Bearer ";

	private final JwtTokenProvider jwtTokenProvider;
	private final CustomUserDetailsService userDetailsService;
	// ChatService를 쓰면 SimpMessagingTemplate → WebSocket 설정 → 이 인터셉터로 순환 의존이 생겨서 레포지토리 직접 사용
	private final ChatRoomRepository chatRoomRepository;

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null || accessor.getCommand() == null) {
			return message;
		}
		switch (accessor.getCommand()) {
			case CONNECT -> accessor.setUser(authenticate(accessor.getFirstNativeHeader("Authorization")));
			case SUBSCRIBE -> checkSubscribe(accessor.getUser(), accessor.getDestination());
			case SEND -> throw new MessageDeliveryException("메시지 전송은 지원하지 않습니다.");
			default -> {
			}
		}
		return message;
	}

	private Principal authenticate(String header) {
		if (header == null || !header.startsWith(BEARER) || !jwtTokenProvider.isValid(header.substring(BEARER.length()))) {
			throw new MessageDeliveryException("인증이 필요합니다.");
		}
		try {
			CustomUserDetails userDetails = userDetailsService.loadUserByUsername(
					jwtTokenProvider.getEmail(header.substring(BEARER.length())));
			if (userDetails.getUser().isSuspended()) {
				throw new MessageDeliveryException("정지된 계정입니다.");
			}
			return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
		} catch (UsernameNotFoundException e) {
			throw new MessageDeliveryException("인증이 필요합니다.");
		}
	}

	private void checkSubscribe(Principal principal, String destination) {
		Matcher matcher = destination == null ? null : ROOM_TOPIC.matcher(destination);
		if (!(principal instanceof UsernamePasswordAuthenticationToken auth) || matcher == null || !matcher.matches()) {
			throw new MessageDeliveryException("구독할 수 없는 경로입니다.");
		}
		CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
		boolean allowed = chatRoomRepository.findWithHospitalById(Long.parseLong(matcher.group(1)))
				.map(room -> room.canAccess(userDetails.getUser()))
				.orElse(false);
		if (!allowed) {
			throw new MessageDeliveryException("이 채팅방에 접근할 권한이 없습니다.");
		}
	}
}
