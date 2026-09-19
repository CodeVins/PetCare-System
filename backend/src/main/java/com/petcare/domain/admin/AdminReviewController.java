package com.petcare.domain.admin;

import com.petcare.domain.hospital.dto.ReviewReportResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReviewController {

	private final AdminReviewService adminReviewService;

	@GetMapping("/reports")
	public ResponseEntity<ApiResponse<PageResponse<ReviewReportResponse>>> getReports(
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(adminReviewService.getReports(pageable)));
	}

	@PatchMapping("/{reviewId}/hide")
	public ResponseEntity<ApiResponse<Void>> hide(@PathVariable Long reviewId) {
		adminReviewService.hide(reviewId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PatchMapping("/{reviewId}/unhide")
	public ResponseEntity<ApiResponse<Void>> unhide(@PathVariable Long reviewId) {
		adminReviewService.unhide(reviewId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
