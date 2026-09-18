package com.petcare.domain.notification.dto;

import com.petcare.domain.notification.NotificationCategory;
import jakarta.validation.constraints.NotNull;

public record NotificationPreferenceUpdateRequest(
		@NotNull(message = "카테고리를 입력해주세요.") NotificationCategory category,
		@NotNull(message = "활성화 여부를 입력해주세요.") Boolean enabled) {
}
