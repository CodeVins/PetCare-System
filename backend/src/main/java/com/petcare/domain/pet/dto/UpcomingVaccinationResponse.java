package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.HealthRecord;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record UpcomingVaccinationResponse(
		Long petId, String petName, Long healthRecordId, LocalDate nextDueDate, long daysRemaining) {

	public static UpcomingVaccinationResponse from(HealthRecord record) {
		long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), record.getNextDueDate());
		return new UpcomingVaccinationResponse(
				record.getPet().getId(), record.getPet().getName(), record.getId(), record.getNextDueDate(), daysRemaining);
	}
}
