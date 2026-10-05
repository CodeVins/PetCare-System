package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Review;
import java.time.LocalDateTime;
import java.util.List;

// 변경(2026-09-27): mine(요청자가 쓴 리뷰인지) 추가 — 작성자 식별 필드가 없어서 프론트가 localStorage로 "내 리뷰"를 추적했고,
// 다른 브라우저/기기에서는 수정·삭제 버튼이 안 보였음. 작성자 id 자체는 노출하지 않으려고 boolean으로만 내려줌
// 변경(2026-10-05): imageUrls(리뷰 사진, 최대 3장) 추가 (이전: 사진 없음)
public record ReviewResponse(
		Long id, int rating, String content, LocalDateTime createdAt, ReviewReplyResponse reply, boolean mine,
		List<String> imageUrls) {

	public static ReviewResponse of(Review review, ReviewReplyResponse reply, Long currentUserId) {
		return new ReviewResponse(review.getId(), review.getRating(), review.getContent(), review.getCreatedAt(), reply,
				review.isOwnedBy(currentUserId), List.copyOf(review.getImageUrls()));
	}

	// 작성/수정 응답용 — 호출자가 항상 작성자 본인
	public static ReviewResponse from(Review review) {
		return new ReviewResponse(review.getId(), review.getRating(), review.getContent(), review.getCreatedAt(), null, true,
				List.copyOf(review.getImageUrls()));
	}
}
