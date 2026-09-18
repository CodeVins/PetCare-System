package com.petcare.domain.healthcheck.dto;

import com.petcare.domain.healthcheck.RiskLevel;

public record HealthCheckResultResponse(
		int totalScore,
		RiskLevel riskLevel,
		String comparisonNote,
		String disclaimer,
		Long savedHealthRecordId
) {
}
