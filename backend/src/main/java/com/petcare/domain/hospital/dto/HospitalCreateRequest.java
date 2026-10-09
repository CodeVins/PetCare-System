package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.HospitalAmenity;
import com.petcare.domain.hospital.HospitalAnimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

// 변경(2026-10-09): phone·description·animals·amenities 추가 — 전화번호·소개·진료 동물·편의 서비스 (이전: 없음)
public record HospitalCreateRequest(
		@NotBlank(message = "병원 이름을 입력해주세요.") String name,
		String address,
		Double latitude,
		Double longitude,
		String openingHours,
		String specialty,
		Boolean is24Hours,
		Boolean hasParking,
		Integer avgTreatmentPrice,
		@Pattern(regexp = "^$|^[0-9]{2,4}-[0-9]{3,4}-[0-9]{4}$", message = "전화번호는 02-123-4567 형식으로 입력해주세요.") String phone,
		@Size(max = 500, message = "병원 소개는 500자 이하로 입력해주세요.") String description,
		Set<HospitalAnimal> animals,
		Set<HospitalAmenity> amenities
) {
}
