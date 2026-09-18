package com.petcare.domain.notification;

public enum NotificationType {
	RESERVATION_REQUESTED(NotificationCategory.RESERVATION),
	RESERVATION_CONFIRMED(NotificationCategory.RESERVATION),
	RESERVATION_REJECTED(NotificationCategory.RESERVATION),
	RESERVATION_CANCELLED(NotificationCategory.RESERVATION),
	RESERVATION_REMINDER(NotificationCategory.RESERVATION),
	VACCINATION_DUE_SOON(NotificationCategory.VACCINATION),
	FAVORITE_HOSPITAL_NEW_SLOT(NotificationCategory.FAVORITE),
	CHAT_MESSAGE_RECEIVED(NotificationCategory.CHAT),
	WAITLIST_SLOT_AVAILABLE(NotificationCategory.WAITLIST);

	private final NotificationCategory category;

	NotificationType(NotificationCategory category) {
		this.category = category;
	}

	public NotificationCategory category() {
		return category;
	}
}
