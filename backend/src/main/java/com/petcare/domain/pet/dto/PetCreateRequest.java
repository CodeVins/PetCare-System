package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.PetSize;
import com.petcare.domain.pet.PetSpecies;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PetCreateRequest(
		@NotBlank(message = "이름을 입력해주세요.") String name,
		@NotNull(message = "종을 선택해주세요.") PetSpecies species,
		String breed,
		LocalDate birthDate,
		PetSize size
) {
}
