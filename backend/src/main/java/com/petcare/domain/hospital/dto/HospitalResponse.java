package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Hospital;

public record HospitalResponse(
		Long id, String name, String address, Double latitude, Double longitude, Double averageRating, long reviewCount) {

	public static HospitalResponse of(Hospital hospital, Double averageRating, long reviewCount) {
		return new HospitalResponse(
				hospital.getId(), hospital.getName(), hospital.getAddress(), hospital.getLatitude(),
				hospital.getLongitude(), averageRating, reviewCount);
	}

	public static HospitalResponse from(Hospital hospital) {
		return of(hospital, null, 0);
	}
}
