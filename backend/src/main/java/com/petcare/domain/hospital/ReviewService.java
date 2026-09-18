package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.ReviewCreateRequest;
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
		return PageResponse.from(
				reviewRepository.findAllByHospitalIdOrderByCreatedAtDesc(hospitalId, pageable).map(ReviewResponse::from));
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

	private Review getOwnedReview(Long userId, Long hospitalId, Long reviewId) {
		Review review = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new NotFoundException("리뷰를 찾을 수 없습니다."));
		if (!review.getHospital().getId().equals(hospitalId)) {
			throw new NotFoundException("리뷰를 찾을 수 없습니다.");
		}
		if (!review.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 리뷰만 수정/삭제할 수 있습니다.");
		}
		return review;
	}
}
