package com.petcare.domain.notification;

import com.petcare.domain.notification.dto.NotificationResponse;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

	private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
	private static final long SSE_TIMEOUT = 30 * 60 * 1000L;

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;
	private final SseEmitterRepository sseEmitterRepository;

	@Transactional
	public void notify(Long userId, NotificationType type, String content) {
		User user = userRepository.getReferenceById(userId);
		Notification notification = Notification.builder()
				.user(user)
				.type(type)
				.content(content)
				.build();
		notificationRepository.save(notification);

		NotificationResponse response = NotificationResponse.from(notification);
		for (SseEmitter emitter : sseEmitterRepository.findAllByUserId(userId)) {
			try {
				emitter.send(SseEmitter.event().name("notification").data(response));
			} catch (IOException e) {
				emitter.complete();
				sseEmitterRepository.remove(userId, emitter);
			}
		}
	}

	public SseEmitter subscribe(Long userId) {
		SseEmitter emitter = sseEmitterRepository.save(userId, new SseEmitter(SSE_TIMEOUT));
		emitter.onCompletion(() -> sseEmitterRepository.remove(userId, emitter));
		emitter.onTimeout(() -> sseEmitterRepository.remove(userId, emitter));
		emitter.onError(e -> sseEmitterRepository.remove(userId, emitter));

		try {
			emitter.send(SseEmitter.event().name("connect").data("connected"));
		} catch (IOException e) {
			log.warn("SSE 초기 연결 전송 실패, userId={}", userId, e);
			sseEmitterRepository.remove(userId, emitter);
		}
		return emitter;
	}

	public PageResponse<NotificationResponse> getMyNotifications(Long userId, Pageable pageable) {
		return PageResponse.from(
				notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable).map(NotificationResponse::from));
	}

	public long getUnreadCount(Long userId) {
		return notificationRepository.countByUserIdAndReadFalse(userId);
	}

	@Transactional
	public void markAsRead(Long userId, Long notificationId) {
		Notification notification = notificationRepository.findById(notificationId)
				.orElseThrow(() -> new NotFoundException("알림을 찾을 수 없습니다."));
		if (!notification.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 알림만 읽음 처리할 수 있습니다.");
		}
		notification.markAsRead();
	}
}
