package com.petcare.domain.admin.dto;

public record StatsSummaryResponse(
		long totalUsers,
		long totalPets,
		long totalHospitals,
		long totalReservations,
		long confirmedReservations,
		long cancelledReservations
) {
}
