package com.petcare.domain.reservation.dto;

import com.petcare.domain.pet.HealthRecordType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

// 병원이 진료 후 작성하는 기록 — type은 TREATMENT(진료) 또는 VACCINATION(접종)만
public record TreatmentRecordRequest(
		@NotNull(message = "기록 종류를 선택해주세요.") HealthRecordType type,
		@NotBlank(message = "진료 내용을 입력해주세요.") @Size(max = 255, message = "진료 내용은 255자 이하로 입력해주세요.") String content,
		LocalDate nextDueDate
) {
}
