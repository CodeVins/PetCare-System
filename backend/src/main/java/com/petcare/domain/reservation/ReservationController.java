package com.petcare.domain.reservation;

import com.petcare.domain.reservation.dto.ReservationCreateRequest;
import com.petcare.domain.reservation.dto.ReservationResponse;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

	private final ReservationService reservationService;

	@PostMapping
	public ResponseEntity<ApiResponse<ReservationResponse>> create(
			@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody ReservationCreateRequest request) {
		ReservationResponse response = reservationService.create(userDetails.getUser().getId(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> getMyReservations(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(
				ApiResponse.success(reservationService.getMyReservations(userDetails.getUser().getId(), pageable)));
	}

	@GetMapping("/{reservationId}")
	public ResponseEntity<ApiResponse<ReservationResponse>> get(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId) {
		return ResponseEntity.ok(ApiResponse.success(reservationService.get(userDetails.getUser().getId(), reservationId)));
	}

	@PatchMapping("/{reservationId}/cancel")
	public ResponseEntity<ApiResponse<Void>> cancel(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId) {
		reservationService.cancel(userDetails.getUser().getId(), reservationId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
