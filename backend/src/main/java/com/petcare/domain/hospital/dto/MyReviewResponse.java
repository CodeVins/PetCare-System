package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Review;
import java.time.LocalDateTime;
import java.util.List;

// 변경(2026-10-05): imageUrls 추가 (이전: 사진 없음)
// 마이페이지 "내가 쓴 리뷰" — 어느 병원 리뷰인지, 숨김 처리됐는지, 병원 답글까지 한 번에
public record MyReviewResponse(
		Long id, Long hospitalId, String hospitalName, int rating, String content, boolean hidden,
		ReviewReplyResponse reply, LocalDateTime createdAt, List<String> imageUrls) {

	public static MyReviewResponse of(Review review, ReviewReplyResponse reply) {
		return new MyReviewResponse(
				review.getId(), review.getHospital().getId(), review.getHospital().getName(), review.getRating(),
				review.getContent(), review.isHidden(), reply, review.getCreatedAt(), List.copyOf(review.getImageUrls()));
	}
}
