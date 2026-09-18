package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.ActivityLevel;
import com.petcare.domain.pet.PetSpecies;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record FeedingCalculatorRequest(
		@NotNull(message = "체중을 입력해주세요.") @Positive(message = "체중은 0보다 커야 합니다.") Double weightKg,
		@NotNull(message = "활동량을 선택해주세요.") ActivityLevel activityLevel,
		@NotNull(message = "종을 선택해주세요.") PetSpecies species,
		@Positive(message = "사료 칼로리 밀도는 0보다 커야 합니다.") Double foodCalorieDensityPer100g
) {
}
