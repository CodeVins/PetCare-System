package com.petcare.domain.hospital.dto;

import jakarta.validation.constraints.NotBlank;

public record HospitalCreateRequest(
		@NotBlank(message = "병원 이름을 입력해주세요.") String name,
		String address,
		Double latitude,
		Double longitude,
		String openingHours,
		String specialty,
		Boolean is24Hours,
		Boolean hasParking,
		Integer avgTreatmentPrice
) {
}
