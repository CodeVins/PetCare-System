package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Review;
import java.time.LocalDateTime;

public record ReviewResponse(
		Long id, int rating, String content, LocalDateTime createdAt, ReviewReplyResponse reply) {

	public static ReviewResponse of(Review review, ReviewReplyResponse reply) {
		return new ReviewResponse(review.getId(), review.getRating(), review.getContent(), review.getCreatedAt(), reply);
	}

	public static ReviewResponse from(Review review) {
		return of(review, null);
	}
}
