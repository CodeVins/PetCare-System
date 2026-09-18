package com.petcare.domain.chat.dto;

import jakarta.validation.constraints.NotNull;

public record ChatRoomCreateRequest(
		@NotNull(message = "병원을 선택해주세요.") Long hospitalId
) {
}
