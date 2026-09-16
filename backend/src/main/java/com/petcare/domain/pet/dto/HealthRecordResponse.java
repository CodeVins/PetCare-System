package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.HealthRecord;
import com.petcare.domain.pet.HealthRecordType;
import java.time.LocalDate;

public record HealthRecordResponse(
		Long id, Long petId, HealthRecordType type, LocalDate recordedAt, String content, Double weight,
		LocalDate nextDueDate) {

	public static HealthRecordResponse from(HealthRecord record) {
		return new HealthRecordResponse(
				record.getId(), record.getPet().getId(), record.getType(), record.getRecordedAt(),
				record.getContent(), record.getWeight(), record.getNextDueDate());
	}
}
