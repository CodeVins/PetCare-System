package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.ReviewCreateRequest;
import com.petcare.domain.hospital.dto.ReviewReplyRequest;
import com.petcare.domain.hospital.dto.ReviewReplyResponse;
import com.petcare.domain.hospital.dto.ReviewReportRequest;
import com.petcare.domain.hospital.dto.ReviewResponse;
import com.petcare.domain.hospital.dto.ReviewUpdateRequest;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hospitals/{hospitalId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

	private final ReviewService reviewService;

	@PostMapping
	public ResponseEntity<ApiResponse<ReviewResponse>> create(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@Valid @RequestBody ReviewCreateRequest request) {
		ReviewResponse response = reviewService.create(userDetails.getUser().getId(), hospitalId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getReviews(
			@PathVariable Long hospitalId, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(reviewService.getReviews(hospitalId, pageable)));
	}

	@PatchMapping("/{reviewId}")
	public ResponseEntity<ApiResponse<ReviewResponse>> update(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@PathVariable Long reviewId, @Valid @RequestBody ReviewUpdateRequest request) {
		ReviewResponse response = reviewService.update(userDetails.getUser().getId(), hospitalId, reviewId, request);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@DeleteMapping("/{reviewId}")
	public ResponseEntity<ApiResponse<Void>> delete(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@PathVariable Long reviewId) {
		reviewService.delete(userDetails.getUser().getId(), hospitalId, reviewId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PostMapping("/{reviewId}/report")
	public ResponseEntity<ApiResponse<Void>> report(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@PathVariable Long reviewId, @Valid @RequestBody ReviewReportRequest request) {
		reviewService.report(userDetails.getUser().getId(), hospitalId, reviewId, request);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PostMapping("/{reviewId}/reply")
	@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
	public ResponseEntity<ApiResponse<ReviewReplyResponse>> createReply(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@PathVariable Long reviewId, @Valid @RequestBody ReviewReplyRequest request) {
		ReviewReplyResponse response = reviewService.createReply(userDetails.getUser(), hospitalId, reviewId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@PatchMapping("/{reviewId}/reply")
	@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
	public ResponseEntity<ApiResponse<ReviewReplyResponse>> updateReply(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@PathVariable Long reviewId, @Valid @RequestBody ReviewReplyRequest request) {
		ReviewReplyResponse response = reviewService.updateReply(userDetails.getUser(), hospitalId, reviewId, request);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@DeleteMapping("/{reviewId}/reply")
	@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
	public ResponseEntity<ApiResponse<Void>> deleteReply(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@PathVariable Long reviewId) {
		reviewService.deleteReply(userDetails.getUser(), hospitalId, reviewId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
