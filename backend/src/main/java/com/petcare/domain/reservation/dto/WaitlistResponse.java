package com.petcare.domain.reservation.dto;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.reservation.Waitlist;
import com.petcare.domain.reservation.WaitlistService;
import java.time.LocalDateTime;

// 변경(2026-09-27): petName, 병원/슬롯 시간(hospitalId, hospitalName, startTime, endTime) 추가 — ReservationResponse와 같은
// 이유로 프론트의 getSlotIndex()/getMyPets() 조인을 없애기 위함 (이전: slotId, petId만 있었음)
// 변경(2026-10-05): offerExpiresAt 추가 — 차례를 받았으면 이 시각까지 예약해야 함(null이면 아직 대기 중) (이전: 없음)
public record WaitlistResponse(
		Long id, Long slotId, Long petId, String petName, Long hospitalId, String hospitalName,
		LocalDateTime startTime, LocalDateTime endTime, LocalDateTime offerExpiresAt) {

	public static WaitlistResponse from(Waitlist waitlist) {
		Slot slot = waitlist.getSlot();
		LocalDateTime offeredAt = waitlist.getOfferedAt();
		return new WaitlistResponse(
				waitlist.getId(), slot.getId(), waitlist.getPet().getId(), waitlist.getPet().getName(),
				slot.getHospital().getId(), slot.getHospital().getName(), slot.getStartTime(), slot.getEndTime(),
				offeredAt == null ? null : offeredAt.plusMinutes(WaitlistService.OFFER_MINUTES));
	}
}
