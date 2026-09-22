package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetRole;
import com.petcare.domain.pet.PetSex;
import com.petcare.domain.pet.PetSize;
import com.petcare.domain.pet.PetSpecies;
import java.time.LocalDate;

public record PetResponse(
		Long id, String name, PetSpecies species, String breed, LocalDate birthDate, PetSize size, PetSex sex,
		Boolean neutered, String imageUrl, PetRole role) {

	public static PetResponse of(Pet pet, PetRole role) {
		return new PetResponse(
				pet.getId(), pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getBirthDate(), pet.getSize(),
				pet.getSex(), pet.getNeutered(), pet.getImageUrl(), role);
	}
}
