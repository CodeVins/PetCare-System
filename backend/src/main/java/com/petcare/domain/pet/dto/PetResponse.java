package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetSize;
import com.petcare.domain.pet.PetSpecies;
import java.time.LocalDate;

public record PetResponse(
		Long id, String name, PetSpecies species, String breed, LocalDate birthDate, PetSize size, String imageUrl) {

	public static PetResponse from(Pet pet) {
		return new PetResponse(
				pet.getId(), pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getBirthDate(), pet.getSize(),
				pet.getImageUrl());
	}
}
