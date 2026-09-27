package com.petcare.domain.reservation.dto;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetSex;
import com.petcare.domain.pet.PetSize;
import com.petcare.domain.pet.PetSpecies;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.ReservationType;
import java.time.LocalDate;
import java.time.LocalDateTime;

// 변경(2026-09-27): 병원/슬롯 시간(hospitalId, hospitalName, startTime, endTime) 추가 — 프론트가 병원 전체 × 슬롯을
// N+1로 조회해 조인하던 getSlotIndex()를 없애기 위함 (이전: slotId만 있어서 시간·병원명을 직접 못 얻었고, 슬롯 첫 페이지(20개)만
// 조인돼서 슬롯이 많은 병원은 "병원 정보 없음"으로 표시되는 버그가 있었음)
public record ReservationResponse(
		Long id, Long petId, String petName, PetSpecies petSpecies, String petBreed, LocalDate petBirthDate,
		PetSize petSize, PetSex petSex, Boolean petNeutered, String petImageUrl, Long slotId, ReservationStatus status,
		ReservationType type, Long hospitalId, String hospitalName, LocalDateTime startTime, LocalDateTime endTime) {

	public static ReservationResponse from(Reservation reservation) {
		Pet pet = reservation.getPet();
		Slot slot = reservation.getSlot();
		return new ReservationResponse(
				reservation.getId(), pet.getId(), pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getBirthDate(),
				pet.getSize(), pet.getSex(), pet.getNeutered(), pet.getImageUrl(), slot.getId(),
				reservation.getStatus(), reservation.getType(), slot.getHospital().getId(), slot.getHospital().getName(),
				slot.getStartTime(), slot.getEndTime());
	}
}
