package com.petcare.domain.admin;

import com.petcare.domain.hospital.Review;
import com.petcare.domain.hospital.ReviewRepository;
import com.petcare.domain.hospital.ReviewReportRepository;
import com.petcare.domain.hospital.dto.ReviewReportResponse;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ForbiddenException;
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

	public PageResponse<ReviewReportResponse> getReports(User currentUser, Pageable pageable) {
		var reports = currentUser.getRole() == Role.ADMIN
				? reviewReportRepository.findAllByOrderByCreatedAtDesc(pageable)
				: reviewReportRepository.findAllByReview_Hospital_OwnerIdOrderByCreatedAtDesc(
						currentUser.getId(), pageable);
		return PageResponse.from(reports.map(ReviewReportResponse::from));
	}

	@Transactional
	public void hide(User currentUser, Long reviewId) {
		findManagedReview(currentUser, reviewId).hide();
	}

	@Transactional
	public void unhide(User currentUser, Long reviewId) {
		findManagedReview(currentUser, reviewId).unhide();
	}

	private Review findManagedReview(User currentUser, Long reviewId) {
		Review review = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new NotFoundException("리뷰를 찾을 수 없습니다."));
		if (!review.getHospital().isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원의 리뷰를 관리할 권한이 없습니다.");
		}
		return review;
	}
}
