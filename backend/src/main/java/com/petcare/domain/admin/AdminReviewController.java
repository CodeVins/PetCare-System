package com.petcare.domain.admin;

import com.petcare.domain.hospital.ReviewSearchCondition;
import com.petcare.domain.hospital.dto.ManagedReviewResponse;
import com.petcare.domain.hospital.dto.ReviewReportResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
@RequiredArgsConstructor
public class AdminReviewController {

	private final AdminReviewService adminReviewService;

	// 관리용 리뷰 목록 — 숨김 리뷰 포함, 작성자 이메일·신고 수까지. sort=createdAt|rating,asc|desc
	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<ManagedReviewResponse>>> getReviews(
			@AuthenticationPrincipal CustomUserDetails userDetails,
			@RequestParam(required = false) Long hospitalId,
			@RequestParam(required = false) String author,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) Boolean hidden,
			@PageableDefault(size = 20) Pageable pageable) {
		var condition = new ReviewSearchCondition(null, hospitalId, author, null, from, to, hidden);
		return ResponseEntity.ok(
				ApiResponse.success(adminReviewService.getReviews(userDetails.getUser(), condition, pageable)));
	}

	// 변경(2026-09-30): 병원/작성자/신고자/신고일 범위/숨김 필터 + sort=createdAt,asc|desc 추가 (이전: 최신순 목록만)
	@GetMapping("/reports")
	public ResponseEntity<ApiResponse<PageResponse<ReviewReportResponse>>> getReports(
			@AuthenticationPrincipal CustomUserDetails userDetails,
			@RequestParam(required = false) Long hospitalId,
			@RequestParam(required = false) String author,
			@RequestParam(required = false) String reporter,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) Boolean hidden,
			@PageableDefault(size = 20) Pageable pageable) {
		var condition = new ReviewSearchCondition(null, hospitalId, author, reporter, from, to, hidden);
		return ResponseEntity.ok(
				ApiResponse.success(adminReviewService.getReports(userDetails.getUser(), condition, pageable)));
	}

	@PatchMapping("/{reviewId}/hide")
	public ResponseEntity<ApiResponse<Void>> hide(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reviewId) {
		adminReviewService.hide(userDetails.getUser(), reviewId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PatchMapping("/{reviewId}/unhide")
	public ResponseEntity<ApiResponse<Void>> unhide(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reviewId) {
		adminReviewService.unhide(userDetails.getUser(), reviewId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
