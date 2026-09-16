package com.petcare.domain.notification;

import com.petcare.domain.notification.dto.NotificationResponse;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;

	@Transactional
	public void notify(Long userId, NotificationType type, String content) {
		User user = userRepository.getReferenceById(userId);
		Notification notification = Notification.builder()
				.user(user)
				.type(type)
				.content(content)
				.build();
		notificationRepository.save(notification);
	}

	public List<NotificationResponse> getMyNotifications(Long userId) {
		return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
				.map(NotificationResponse::from)
				.toList();
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
