package com.petcare.domain.reservation;

import com.petcare.domain.reservation.dto.ReservationCreateRequest;
import com.petcare.domain.reservation.dto.ReservationRescheduleRequest;
import com.petcare.domain.reservation.dto.ReservationResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

	// 변경(2026-10-09): petId·view 필터 추가 (이전: 내 예약 전체만)
	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> getMyReservations(
			@AuthenticationPrincipal CustomUserDetails userDetails,
			@RequestParam(required = false) Long petId,
			@RequestParam(defaultValue = "ALL") ReservationView view,
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(
				reservationService.getMyReservations(userDetails.getUser().getId(), petId, view, pageable)));
	}

	@GetMapping("/counts")
	public ResponseEntity<ApiResponse<Map<ReservationView, Long>>> countMyReservations(
			@AuthenticationPrincipal CustomUserDetails userDetails, @RequestParam(required = false) Long petId) {
		return ResponseEntity.ok(ApiResponse.success(
				reservationService.countMyReservations(userDetails.getUser().getId(), petId)));
	}

	@DeleteMapping("/{reservationId}")
	public ResponseEntity<ApiResponse<Void>> hide(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId) {
		reservationService.hide(userDetails.getUser().getId(), reservationId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@DeleteMapping("/cancelled")
	public ResponseEntity<ApiResponse<Integer>> hideAllCancelled(@AuthenticationPrincipal CustomUserDetails userDetails) {
		return ResponseEntity.ok(ApiResponse.success(reservationService.hideAllCancelled(userDetails.getUser().getId())));
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

	@PatchMapping("/{reservationId}/reschedule")
	public ResponseEntity<ApiResponse<ReservationResponse>> reschedule(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId,
			@Valid @RequestBody ReservationRescheduleRequest request) {
		return ResponseEntity.ok(ApiResponse.success(
				reservationService.reschedule(userDetails.getUser().getId(), reservationId, request.slotId())));
	}
}
