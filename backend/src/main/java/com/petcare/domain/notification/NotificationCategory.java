package com.petcare.domain.notification;

public enum NotificationCategory {
	RESERVATION,
	VACCINATION,
	FAVORITE,
	CHAT,
	WAITLIST,
	// 반복 일정 알림 — 매일 오는 알림이라 기본 꺼짐(원하는 사람만 설정에서 켬)
	ROUTINE(false);

	private final boolean enabledByDefault;

	NotificationCategory() {
		this(true);
	}

	NotificationCategory(boolean enabledByDefault) {
		this.enabledByDefault = enabledByDefault;
	}

	// 설정 행이 없을 때의 값
	public boolean enabledByDefault() {
		return enabledByDefault;
	}
}
