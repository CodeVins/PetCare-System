package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Review;
import java.time.LocalDateTime;

// 관리 화면(관리자/병원 소유자) 리뷰 목록 — 공개 ReviewResponse와 달리 작성자·숨김 여부·신고 수까지 내려준다
public record ManagedReviewResponse(
		Long id, Long hospitalId, String hospitalName, Long authorId, String authorEmail, int rating, String content,
		boolean hidden, long reportCount, ReviewReplyResponse reply, LocalDateTime createdAt) {

	public static ManagedReviewResponse of(Review review, ReviewReplyResponse reply, long reportCount) {
		return new ManagedReviewResponse(
				review.getId(), review.getHospital().getId(), review.getHospital().getName(), review.getUser().getId(),
				review.getUser().getEmail(), review.getRating(), review.getContent(), review.isHidden(), reportCount,
				reply, review.getCreatedAt());
	}
}
