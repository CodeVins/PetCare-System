package com.petcare.domain.reservation.dto;

import jakarta.validation.constraints.NotNull;

public record WaitlistCreateRequest(
		@NotNull(message = "반려동물을 선택해주세요.") Long petId,
		@NotNull(message = "예약 시간을 선택해주세요.") Long slotId
) {
}
