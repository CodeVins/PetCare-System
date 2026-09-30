package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.ReviewReport;
import java.time.LocalDateTime;

// 변경(2026-09-30): hospitalName, reporterEmail, reviewAuthorId/Email, reviewCreatedAt 추가 — 관리 화면에서 신고자·작성자·
// 작성일로 확인·필터링하려고 (이전: 신고자 id만 있고 병원명은 프론트가 병원 목록을 따로 받아 조인)
public record ReviewReportResponse(
		Long id, Long reviewId, Long hospitalId, String hospitalName, String reviewContent, int reviewRating,
		boolean reviewHidden, LocalDateTime reviewCreatedAt, Long reviewAuthorId, String reviewAuthorEmail,
		Long reporterId, String reporterEmail, String reason, LocalDateTime createdAt) {

	public static ReviewReportResponse from(ReviewReport report) {
		var review = report.getReview();
		return new ReviewReportResponse(
				report.getId(),
				review.getId(),
				review.getHospital().getId(),
				review.getHospital().getName(),
				review.getContent(),
				review.getRating(),
				review.isHidden(),
				review.getCreatedAt(),
				review.getUser().getId(),
				review.getUser().getEmail(),
				report.getReporter().getId(),
				report.getReporter().getEmail(),
				report.getReason(),
				report.getCreatedAt());
	}
}
