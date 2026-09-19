package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.PetGuardian;
import java.time.LocalDateTime;

public record PetGuardianResponse(Long userId, String email, LocalDateTime addedAt) {

	public static PetGuardianResponse from(PetGuardian guardian) {
		return new PetGuardianResponse(guardian.getUser().getId(), guardian.getUser().getEmail(), guardian.getCreatedAt());
	}
}
