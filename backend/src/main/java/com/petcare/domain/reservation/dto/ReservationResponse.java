package com.petcare.domain.reservation.dto;

import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationStatus;

public record ReservationResponse(Long id, Long petId, Long slotId, ReservationStatus status) {

	public static ReservationResponse from(Reservation reservation) {
		return new ReservationResponse(
				reservation.getId(), reservation.getPet().getId(), reservation.getSlot().getId(), reservation.getStatus());
	}
}
