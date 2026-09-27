package com.petcare.domain.hospital.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

// 예: 2026-10-01~2026-10-31, 월~금, 10:00~18:00, 30분 단위
public record SlotBulkCreateRequest(
		@NotNull(message = "시작 날짜를 입력해주세요.") LocalDate startDate,
		@NotNull(message = "종료 날짜를 입력해주세요.") LocalDate endDate,
		@NotEmpty(message = "요일을 하나 이상 선택해주세요.") Set<DayOfWeek> daysOfWeek,
		@NotNull(message = "하루 시작 시간을 입력해주세요.") LocalTime startTime,
		@NotNull(message = "하루 종료 시간을 입력해주세요.") LocalTime endTime,
		@NotNull(message = "간격을 입력해주세요.")
		@Min(value = 10, message = "간격은 10분 이상이어야 합니다.")
		@Max(value = 240, message = "간격은 240분 이하여야 합니다.") Integer intervalMinutes
) {
}
