package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.PetSize;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record PetUpdateRequest(
		@NotBlank(message = "이름을 입력해주세요.") String name,
		String breed,
		LocalDate birthDate,
		PetSize size
) {
}
