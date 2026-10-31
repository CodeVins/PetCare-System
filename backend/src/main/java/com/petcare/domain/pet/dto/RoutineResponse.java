package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.HealthRecordType;
import com.petcare.domain.pet.PetRoutine;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record RoutineResponse(
		Long id,
		Long petId,
		HealthRecordType type,
		String title,
		LocalTime time,
		// 월→일 순서 (Set이라 저장 순서가 없어서)
		List<DayOfWeek> daysOfWeek,
		LocalDate startDate,
		LocalDate endDate
) {

	public static RoutineResponse from(PetRoutine routine) {
		return new RoutineResponse(
				routine.getId(), routine.getPet().getId(), routine.getType(), routine.getTitle(), routine.getTime(),
				routine.getDaysOfWeek().stream().sorted().toList(),
				routine.getStartDate(), routine.getEndDate());
	}
}
