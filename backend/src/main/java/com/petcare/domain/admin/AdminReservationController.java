package com.petcare.domain.admin;

import com.petcare.domain.reservation.ReservationService;
import com.petcare.domain.reservation.TreatmentRecordService;
import com.petcare.domain.reservation.dto.TreatmentRecordRequest;
import com.petcare.domain.pet.dto.HealthRecordResponse;
import jakarta.validation.Valid;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.dto.ReservationResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reservations")
@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
@RequiredArgsConstructor
public class AdminReservationController {

	private final ReservationService reservationService;
	private final TreatmentRecordService treatmentRecordService;

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> getAll(
			@AuthenticationPrincipal CustomUserDetails userDetails,
			@RequestParam(required = false) ReservationStatus status, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(
				ApiResponse.success(reservationService.getAllForAdmin(userDetails.getUser(), status, pageable)));
	}

	@PatchMapping("/{reservationId}/confirm")
	public ResponseEntity<ApiResponse<Void>> confirm(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId) {
		reservationService.confirm(userDetails.getUser(), reservationId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PatchMapping("/{reservationId}/reject")
	public ResponseEntity<ApiResponse<Void>> reject(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId) {
		reservationService.reject(userDetails.getUser(), reservationId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	// 진료 기록 — 없으면 data가 null
	@GetMapping("/{reservationId}/treatment")
	public ResponseEntity<ApiResponse<HealthRecordResponse>> getTreatment(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId) {
		return ResponseEntity.ok(ApiResponse.success(treatmentRecordService.get(userDetails.getUser(), reservationId)));
	}

	// 작성/수정 겸용(예약당 1개)
	@PutMapping("/{reservationId}/treatment")
	public ResponseEntity<ApiResponse<HealthRecordResponse>> saveTreatment(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId,
			@Valid @RequestBody TreatmentRecordRequest request) {
		return ResponseEntity.ok(ApiResponse.success(
				treatmentRecordService.save(userDetails.getUser(), reservationId, request)));
	}

	@PatchMapping("/{reservationId}/no-show")
	public ResponseEntity<ApiResponse<Void>> noShow(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long reservationId) {
		reservationService.noShow(userDetails.getUser(), reservationId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
