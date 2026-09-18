package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Hospital;

public record HospitalResponse(
		Long id, String name, String address, Double latitude, Double longitude, String openingHours,
		String specialty, Double averageRating, long reviewCount, Double distanceKm) {

	public static HospitalResponse of(Hospital hospital, Double averageRating, long reviewCount) {
		return new HospitalResponse(
				hospital.getId(), hospital.getName(), hospital.getAddress(), hospital.getLatitude(),
				hospital.getLongitude(), hospital.getOpeningHours(), hospital.getSpecialty(), averageRating,
				reviewCount, null);
	}

	public static HospitalResponse from(Hospital hospital) {
		return of(hospital, null, 0);
	}

	public HospitalResponse withDistance(Double distanceKm) {
		return new HospitalResponse(
				id, name, address, latitude, longitude, openingHours, specialty, averageRating, reviewCount,
				distanceKm);
	}
}
