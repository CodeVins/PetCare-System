package com.petcare.domain.admin.dto;

public record HospitalStatsResponse(
		Long hospitalId,
		String hospitalName,
		long reservationCount,
		long reviewCount,
		Double averageRating
) {
}
