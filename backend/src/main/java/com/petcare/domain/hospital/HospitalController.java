package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.HospitalCreateRequest;
import com.petcare.domain.hospital.dto.HospitalResponse;
import com.petcare.domain.hospital.dto.HospitalUpdateRequest;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class HospitalController {

	private final HospitalService hospitalService;

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<HospitalResponse>> create(@Valid @RequestBody HospitalCreateRequest request) {
		HospitalResponse response = hospitalService.create(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<HospitalResponse>>> search(
			@RequestParam(required = false) String keyword,
			@RequestParam(required = false) Double minRating,
			@RequestParam(required = false, defaultValue = "NAME_ASC") HospitalSortType sort,
			@RequestParam(required = false) Double lat,
			@RequestParam(required = false) Double lng,
			@RequestParam(required = false) Double radiusKm,
			@RequestParam(required = false) Boolean is24Hours,
			@RequestParam(required = false) Boolean hasParking) {
		return ResponseEntity.ok(ApiResponse.success(
				hospitalService.search(keyword, minRating, sort, lat, lng, radiusKm, is24Hours, hasParking)));
	}

	@GetMapping("/{hospitalId}")
	public ResponseEntity<ApiResponse<HospitalResponse>> get(@PathVariable Long hospitalId) {
		return ResponseEntity.ok(ApiResponse.success(hospitalService.get(hospitalId)));
	}

	@PatchMapping("/{hospitalId}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
	public ResponseEntity<ApiResponse<HospitalResponse>> update(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@Valid @RequestBody HospitalUpdateRequest request) {
		HospitalResponse response = hospitalService.update(userDetails.getUser(), hospitalId, request);
		return ResponseEntity.ok(ApiResponse.success(response));
	}
}
