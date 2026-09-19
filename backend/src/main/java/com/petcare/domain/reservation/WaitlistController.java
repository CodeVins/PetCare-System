package com.petcare.domain.reservation;

import com.petcare.domain.reservation.dto.WaitlistCreateRequest;
import com.petcare.domain.reservation.dto.WaitlistResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/waitlists")
@RequiredArgsConstructor
public class WaitlistController {

	private final WaitlistService waitlistService;

	@PostMapping
	public ResponseEntity<ApiResponse<WaitlistResponse>> join(
			@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody WaitlistCreateRequest request) {
		WaitlistResponse response = waitlistService.join(userDetails.getUser().getId(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<WaitlistResponse>>> getMyWaitlist(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(waitlistService.getMyWaitlist(userDetails.getUser().getId(), pageable)));
	}

	@DeleteMapping("/{waitlistId}")
	public ResponseEntity<ApiResponse<Void>> leave(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long waitlistId) {
		waitlistService.leave(userDetails.getUser().getId(), waitlistId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
