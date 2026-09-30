package com.petcare.domain.admin;

import com.petcare.domain.hospital.Review;
import com.petcare.domain.hospital.ReviewRepository;
import com.petcare.domain.hospital.ReviewReportRepository;
import com.petcare.domain.hospital.ReviewSearchCondition;
import com.petcare.domain.hospital.ReviewService;
import com.petcare.domain.hospital.dto.ManagedReviewResponse;
import com.petcare.domain.hospital.dto.ReviewReplyResponse;
import com.petcare.domain.hospital.dto.ReviewReportResponse;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.util.Map;
import java.util.stream.Collectors;
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
	private final ReviewService reviewService;

	public PageResponse<ManagedReviewResponse> getReviews(
			User currentUser, ReviewSearchCondition condition, Pageable pageable) {
		var reviews = reviewRepository.searchForManager(scoped(currentUser, condition), pageable);
		var ids = reviews.map(Review::getId).toList();
		Map<Long, ReviewReplyResponse> replies = reviewService.repliesOf(ids);
		Map<Long, Long> reportCounts = ids.isEmpty() ? Map.of()
				: reviewReportRepository.countByReviewIds(ids).stream()
						.collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
		return PageResponse.from(reviews.map(review -> ManagedReviewResponse.of(
				review, replies.get(review.getId()), reportCounts.getOrDefault(review.getId(), 0L))));
	}

	// 변경(2026-09-30): 필터 조건(병원/작성자/신고자/신고일 범위/숨김) 추가, 스코핑은 조건의 managerId로
	// (이전: ADMIN 전체 / OWNER 본인 병원 최신순 목록만)
	public PageResponse<ReviewReportResponse> getReports(
			User currentUser, ReviewSearchCondition condition, Pageable pageable) {
		return PageResponse.from(reviewReportRepository
				.searchForManager(scoped(currentUser, condition), pageable)
				.map(ReviewReportResponse::from));
	}

	@Transactional
	public void hide(User currentUser, Long reviewId) {
		findManagedReview(currentUser, reviewId).hide();
	}

	@Transactional
	public void unhide(User currentUser, Long reviewId) {
		findManagedReview(currentUser, reviewId).unhide();
	}

	// ADMIN은 전체, HOSPITAL_OWNER는 요청 값과 무관하게 본인 병원으로 강제
	private ReviewSearchCondition scoped(User currentUser, ReviewSearchCondition c) {
		Long managerId = currentUser.getRole() == Role.ADMIN ? null : currentUser.getId();
		return new ReviewSearchCondition(managerId, c.hospitalId(), c.author(), c.reporter(), c.from(), c.to(), c.hidden());
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
