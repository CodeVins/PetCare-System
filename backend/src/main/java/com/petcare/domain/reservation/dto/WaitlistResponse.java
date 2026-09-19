package com.petcare.domain.reservation.dto;

import com.petcare.domain.reservation.Waitlist;

public record WaitlistResponse(Long id, Long slotId, Long petId) {

	public static WaitlistResponse from(Waitlist waitlist) {
		return new WaitlistResponse(waitlist.getId(), waitlist.getSlot().getId(), waitlist.getPet().getId());
	}
}
