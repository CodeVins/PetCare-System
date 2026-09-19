package com.petcare.domain.admin;

import com.petcare.domain.hospital.Review;
import com.petcare.domain.hospital.ReviewRepository;
import com.petcare.domain.hospital.ReviewReportRepository;
import com.petcare.domain.hospital.dto.ReviewReportResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReviewService {

	private final ReviewRepository reviewRepository;
	private final ReviewReportRepository reviewReportRepository;

	public PageResponse<ReviewReportResponse> getReports(Pageable pageable) {
		return PageResponse.from(reviewReportRepository.findAllByOrderByCreatedAtDesc(pageable)
				.map(ReviewReportResponse::from));
	}

	@Transactional
	public void hide(Long reviewId) {
		findReview(reviewId).hide();
	}

	@Transactional
	public void unhide(Long reviewId) {
		findReview(reviewId).unhide();
	}

	private Review findReview(Long reviewId) {
		return reviewRepository.findById(reviewId).orElseThrow(() -> new NotFoundException("리뷰를 찾을 수 없습니다."));
	}
}
