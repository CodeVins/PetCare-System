package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.HealthRecordType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record HealthRecordUpdateRequest(
		@NotNull(message = "기록 종류를 선택해주세요.") HealthRecordType type,
		@NotNull(message = "기록 날짜를 입력해주세요.") LocalDate recordedAt,
		@NotBlank(message = "내용을 입력해주세요.") String content,
		Double weight,
		LocalDate nextDueDate
) {
}
