package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.MyReviewResponse;
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
import com.petcare.global.file.FileStorageService;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
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
	private final FileStorageService fileStorageService;

	@Transactional
	// 변경(2026-10-02): 리뷰가 바뀌면 병원 평점 집계가 바뀌므로 병원 상세 캐시 무효화 (이전: 캐시 없음)
	@CacheEvict(cacheNames = HospitalService.CACHE, key = "#hospitalId")
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

	// 변경(2026-09-27): 요청자 id를 받아 리뷰별 mine 계산 (이전: 요청자와 무관한 응답이라 프론트가 내 리뷰를 식별 못 함)
	public PageResponse<ReviewResponse> getReviews(Long userId, Long hospitalId, Pageable pageable) {
		return PageResponse.from(reviewRepository
				.findAllByHospitalIdAndHiddenFalseOrderByCreatedAtDesc(hospitalId, pageable)
				.map(review -> ReviewResponse.of(review, reviewReplyRepository.findByReviewId(review.getId())
						.map(ReviewReplyResponse::from)
						.orElse(null), userId)));
	}

	public PageResponse<MyReviewResponse> getMyReviews(Long userId, Pageable pageable) {
		var reviews = reviewRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
		Map<Long, ReviewReplyResponse> replies = repliesOf(reviews.map(Review::getId).toList());
		return PageResponse.from(reviews.map(review -> MyReviewResponse.of(review, replies.get(review.getId()))));
	}

	// 리뷰 목록의 답글을 IN 쿼리 한 번으로 — 관리 화면 목록(AdminReviewService)도 같이 씀
	public Map<Long, ReviewReplyResponse> repliesOf(Collection<Long> reviewIds) {
		if (reviewIds.isEmpty()) {
			return Map.of();
		}
		return reviewReplyRepository.findAllByReviewIdIn(reviewIds).stream()
				.collect(Collectors.toMap(reply -> reply.getReview().getId(), ReviewReplyResponse::from));
	}

	@Transactional
	// 변경(2026-10-02): 리뷰가 바뀌면 병원 평점 집계가 바뀌므로 병원 상세 캐시 무효화 (이전: 캐시 없음)
	@CacheEvict(cacheNames = HospitalService.CACHE, key = "#hospitalId")
	public ReviewResponse update(Long userId, Long hospitalId, Long reviewId, ReviewUpdateRequest request) {
		Review review = getOwnedReview(userId, hospitalId, reviewId);
		review.update(request.rating(), request.content());
		return ReviewResponse.from(review);
	}

	@Transactional
	// 변경(2026-10-02): 리뷰가 바뀌면 병원 평점 집계가 바뀌므로 병원 상세 캐시 무효화 (이전: 캐시 없음)
	@CacheEvict(cacheNames = HospitalService.CACHE, key = "#hospitalId")
	public void delete(Long userId, Long hospitalId, Long reviewId) {
		Review review = getOwnedReview(userId, hospitalId, reviewId);
		// 변경(2026-10-05): 리뷰 사진 파일도 같이 삭제 — DB 행은 값 컬렉션이라 자동 삭제, 파일은 직접 (이전: 사진 없음)
		List<String> imageUrls = List.copyOf(review.getImageUrls());
		reviewRepository.delete(review);
		imageUrls.forEach(fileStorageService::deleteReviewImage);
	}

	@Transactional
	public ReviewResponse addImage(Long userId, Long hospitalId, Long reviewId, MultipartFile file) {
		Review review = getOwnedReview(userId, hospitalId, reviewId);
		if (!review.canAddImage()) {
			throw new ConflictException("사진은 리뷰당 최대 " + Review.MAX_IMAGES + "장까지 올릴 수 있습니다.");
		}
		review.addImage(fileStorageService.storeReviewImage(file));
		return ReviewResponse.from(review);
	}

	// fileName은 업로드 때 서버가 만든 UUID 파일명 — 이 리뷰의 사진 목록에 있는 것만 삭제(다른 파일 경로 조작 방지)
	@Transactional
	public ReviewResponse deleteImage(Long userId, Long hospitalId, Long reviewId, String fileName) {
		Review review = getOwnedReview(userId, hospitalId, reviewId);
		String imageUrl = review.getImageUrls().stream()
				.filter(url -> url.endsWith("/" + fileName))
				.findFirst()
				.orElseThrow(() -> new NotFoundException("사진을 찾을 수 없습니다."));
		review.removeImage(imageUrl);
		fileStorageService.deleteReviewImage(imageUrl);
		return ReviewResponse.from(review);
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
