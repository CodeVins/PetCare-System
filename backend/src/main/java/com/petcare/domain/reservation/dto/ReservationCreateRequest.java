package com.petcare.domain.reservation.dto;

import com.petcare.domain.reservation.ReservationType;
import jakarta.validation.constraints.NotNull;

public record ReservationCreateRequest(
		@NotNull(message = "반려동물을 선택해주세요.") Long petId,
		@NotNull(message = "예약 시간을 선택해주세요.") Long slotId,
		@NotNull(message = "진료 종류를 선택해주세요.") ReservationType type
) {
}
