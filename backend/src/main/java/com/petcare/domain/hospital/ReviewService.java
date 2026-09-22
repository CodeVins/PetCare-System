package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.ReviewCreateRequest;
import com.petcare.domain.hospital.dto.ReviewReplyRequest;
import com.petcare.domain.hospital.dto.ReviewReplyResponse;
import com.petcare.domain.hospital.dto.ReviewReportRequest;
import com.petcare.domain.hospital.dto.ReviewResponse;
import com.petcare.domain.hospital.dto.ReviewUpdateRequest;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

	private final ReviewRepository reviewRepository;
	private final ReviewReportRepository reviewReportRepository;
	private final ReviewReplyRepository reviewReplyRepository;
	private final ReservationRepository reservationRepository;
	private final UserRepository userRepository;
	private final HospitalService hospitalService;

	@Transactional
	public ReviewResponse create(Long userId, Long hospitalId, ReviewCreateRequest request) {
		Hospital hospital = hospitalService.findHospital(hospitalId);

		boolean hasVisited = reservationRepository
				.existsByUserIdAndSlot_Hospital_IdAndStatus(userId, hospitalId, ReservationStatus.CONFIRMED);
		if (!hasVisited) {
			throw new ForbiddenException("해당 병원을 예약한 이력이 있어야 리뷰를 작성할 수 있습니다.");
		}
		if (reviewRepository.existsByUserIdAndHospitalId(userId, hospitalId)) {
			throw new ConflictException("이미 이 병원에 리뷰를 작성했습니다.");
		}

		User user = userRepository.getReferenceById(userId);
		Review review = Review.builder()
				.hospital(hospital)
				.user(user)
				.rating(request.rating())
				.content(request.content())
				.build();

		return ReviewResponse.from(reviewRepository.save(review));
	}

	public PageResponse<ReviewResponse> getReviews(Long hospitalId, Pageable pageable) {
		return PageResponse.from(reviewRepository
				.findAllByHospitalIdAndHiddenFalseOrderByCreatedAtDesc(hospitalId, pageable)
				.map(review -> ReviewResponse.of(review, reviewReplyRepository.findByReviewId(review.getId())
						.map(ReviewReplyResponse::from)
						.orElse(null))));
	}

	@Transactional
	public ReviewResponse update(Long userId, Long hospitalId, Long reviewId, ReviewUpdateRequest request) {
		Review review = getOwnedReview(userId, hospitalId, reviewId);
		review.update(request.rating(), request.content());
		return ReviewResponse.from(review);
	}

	@Transactional
	public void delete(Long userId, Long hospitalId, Long reviewId) {
		Review review = getOwnedReview(userId, hospitalId, reviewId);
		reviewRepository.delete(review);
	}

	@Transactional
	public void report(Long userId, Long hospitalId, Long reviewId, ReviewReportRequest request) {
		Review review = findReviewInHospital(hospitalId, reviewId);
		if (reviewReportRepository.existsByReviewIdAndReporterId(reviewId, userId)) {
			throw new ConflictException("이미 신고한 리뷰입니다.");
		}

		User reporter = userRepository.getReferenceById(userId);
		reviewReportRepository.save(ReviewReport.builder().review(review).reporter(reporter).reason(request.reason())
				.build());
	}

	@Transactional
	public ReviewReplyResponse createReply(User currentUser, Long hospitalId, Long reviewId, ReviewReplyRequest request) {
		Review review = findManagedReview(currentUser, hospitalId, reviewId);
		if (reviewReplyRepository.existsByReviewId(reviewId)) {
			throw new ConflictException("이미 답글이 작성된 리뷰입니다.");
		}
		ReviewReply reply = ReviewReply.builder().review(review).author(currentUser).content(request.content()).build();
		return ReviewReplyResponse.from(reviewReplyRepository.save(reply));
	}

	@Transactional
	public ReviewReplyResponse updateReply(User currentUser, Long hospitalId, Long reviewId, ReviewReplyRequest request) {
		ReviewReply reply = getOwnedReply(currentUser, hospitalId, reviewId);
		reply.update(request.content());
		return ReviewReplyResponse.from(reply);
	}

	@Transactional
	public void deleteReply(User currentUser, Long hospitalId, Long reviewId) {
		reviewReplyRepository.delete(getOwnedReply(currentUser, hospitalId, reviewId));
	}

	private ReviewReply getOwnedReply(User currentUser, Long hospitalId, Long reviewId) {
		findManagedReview(currentUser, hospitalId, reviewId);
		return reviewReplyRepository.findByReviewId(reviewId)
				.orElseThrow(() -> new NotFoundException("답글을 찾을 수 없습니다."));
	}

	private Review findManagedReview(User currentUser, Long hospitalId, Long reviewId) {
		Review review = findReviewInHospital(hospitalId, reviewId);
		if (!review.getHospital().isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원의 리뷰를 관리할 권한이 없습니다.");
		}
		return review;
	}

	private Review getOwnedReview(Long userId, Long hospitalId, Long reviewId) {
		Review review = findReviewInHospital(hospitalId, reviewId);
		if (!review.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 리뷰만 수정/삭제할 수 있습니다.");
		}
		return review;
	}

	private Review findReviewInHospital(Long hospitalId, Long reviewId) {
		Review review = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new NotFoundException("리뷰를 찾을 수 없습니다."));
		if (!review.getHospital().getId().equals(hospitalId)) {
			throw new NotFoundException("리뷰를 찾을 수 없습니다.");
		}
		return review;
	}
}
