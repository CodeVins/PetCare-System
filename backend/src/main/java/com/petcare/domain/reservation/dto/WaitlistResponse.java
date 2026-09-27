package com.petcare.domain.reservation.dto;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.reservation.Waitlist;
import java.time.LocalDateTime;

// 변경(2026-09-27): petName, 병원/슬롯 시간(hospitalId, hospitalName, startTime, endTime) 추가 — ReservationResponse와 같은
// 이유로 프론트의 getSlotIndex()/getMyPets() 조인을 없애기 위함 (이전: slotId, petId만 있었음)
public record WaitlistResponse(
		Long id, Long slotId, Long petId, String petName, Long hospitalId, String hospitalName,
		LocalDateTime startTime, LocalDateTime endTime) {

	public static WaitlistResponse from(Waitlist waitlist) {
		Slot slot = waitlist.getSlot();
		return new WaitlistResponse(
				waitlist.getId(), slot.getId(), waitlist.getPet().getId(), waitlist.getPet().getName(),
				slot.getHospital().getId(), slot.getHospital().getName(), slot.getStartTime(), slot.getEndTime());
	}
}
