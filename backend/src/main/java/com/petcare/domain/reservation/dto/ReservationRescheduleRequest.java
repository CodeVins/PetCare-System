package com.petcare.domain.reservation.dto;

import jakarta.validation.constraints.NotNull;

public record ReservationRescheduleRequest(
		@NotNull(message = "변경할 시간을 선택해주세요.") Long slotId
) {
}
