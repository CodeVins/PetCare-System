package com.petcare.domain.notification.dto;

import com.petcare.domain.notification.Notification;
import com.petcare.domain.notification.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponse(
		Long id, NotificationType type, String content, boolean read, LocalDateTime createdAt) {

	public static NotificationResponse from(Notification notification) {
		return new NotificationResponse(
				notification.getId(), notification.getType(), notification.getContent(),
				notification.isRead(), notification.getCreatedAt());
	}
}
