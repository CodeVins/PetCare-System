package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.ReviewReport;
import java.time.LocalDateTime;

public record ReviewReportResponse(
		Long id, Long reviewId, Long hospitalId, String reviewContent, int reviewRating, boolean reviewHidden,
		Long reporterId, String reason, LocalDateTime createdAt) {

	public static ReviewReportResponse from(ReviewReport report) {
		return new ReviewReportResponse(
				report.getId(),
				report.getReview().getId(),
				report.getReview().getHospital().getId(),
				report.getReview().getContent(),
				report.getReview().getRating(),
				report.getReview().isHidden(),
				report.getReporter().getId(),
				report.getReason(),
				report.getCreatedAt());
	}
}
