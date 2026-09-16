package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotStatus;
import java.time.LocalDateTime;

public record SlotResponse(Long id, Long hospitalId, LocalDateTime startTime, LocalDateTime endTime, SlotStatus status) {

	public static SlotResponse from(Slot slot) {
		return new SlotResponse(
				slot.getId(), slot.getHospital().getId(), slot.getStartTime(), slot.getEndTime(), slot.getStatus());
	}
}
