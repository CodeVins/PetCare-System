package com.petcare.domain.hospital.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

// 요일별 진료 시간 전체 교체 — 빈 목록이면 진료 시간 정보 삭제. 휴무인 요일은 그냥 빼면 됨
public record OpeningHoursUpdateRequest(
		@NotNull(message = "진료 시간 목록이 필요합니다.") @Size(max = 21, message = "진료 시간은 최대 21개(요일당 3개)까지 등록할 수 있습니다.")
		@Valid List<Hour> hours
) {

	public record Hour(
			@NotNull(message = "요일을 선택해주세요.") DayOfWeek dayOfWeek,
			@NotNull(message = "시작 시간을 입력해주세요.") LocalTime openTime,
			@NotNull(message = "종료 시간을 입력해주세요.") LocalTime closeTime
	) {
	}
}
