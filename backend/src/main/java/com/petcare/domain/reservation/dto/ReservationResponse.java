package com.petcare.domain.reservation.dto;

import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetSex;
import com.petcare.domain.pet.PetSize;
import com.petcare.domain.pet.PetSpecies;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.ReservationType;
import java.time.LocalDate;

public record ReservationResponse(
		Long id, Long petId, String petName, PetSpecies petSpecies, String petBreed, LocalDate petBirthDate,
		PetSize petSize, PetSex petSex, Boolean petNeutered, String petImageUrl, Long slotId, ReservationStatus status,
		ReservationType type) {

	public static ReservationResponse from(Reservation reservation) {
		Pet pet = reservation.getPet();
		return new ReservationResponse(
				reservation.getId(), pet.getId(), pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getBirthDate(),
				pet.getSize(), pet.getSex(), pet.getNeutered(), pet.getImageUrl(), reservation.getSlot().getId(),
				reservation.getStatus(), reservation.getType());
	}
}
