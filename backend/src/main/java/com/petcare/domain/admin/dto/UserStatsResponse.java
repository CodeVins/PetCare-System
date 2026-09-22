package com.petcare.domain.admin.dto;

public record UserStatsResponse(
		long reservationCount,
		long noShowCount,
		long replyCount,
		long petCount,
		long guardianCount
) {
}
