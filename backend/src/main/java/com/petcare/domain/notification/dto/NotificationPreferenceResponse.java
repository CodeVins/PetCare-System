package com.petcare.domain.notification.dto;

import com.petcare.domain.notification.NotificationCategory;

public record NotificationPreferenceResponse(NotificationCategory category, boolean enabled) {
}
