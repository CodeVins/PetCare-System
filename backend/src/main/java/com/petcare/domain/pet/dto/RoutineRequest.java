package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.HealthRecordType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

// 생성·수정 겸용(전체 교체). daysOfWeek가 비었으면 startDate 하루만 있는 일회성 일정
public record RoutineRequest(
		@NotNull(message = "종류를 선택해주세요.") HealthRecordType type,
		@NotBlank(message = "이름을 입력해주세요.") @Size(max = 50, message = "이름은 50자 이하로 입력해주세요.") String title,
		LocalTime time,
		Set<DayOfWeek> daysOfWeek,
		@NotNull(message = "시작일을 입력해주세요.") LocalDate startDate,
		LocalDate endDate
) {
}
