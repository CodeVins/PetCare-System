package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.SlotCreateRequest;
import com.petcare.domain.hospital.dto.SlotResponse;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hospitals/{hospitalId}/slots")
@RequiredArgsConstructor
public class SlotController {

	private final SlotService slotService;

	@PostMapping
	@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
	public ResponseEntity<ApiResponse<SlotResponse>> create(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@Valid @RequestBody SlotCreateRequest request) {
		SlotResponse response = slotService.create(userDetails.getUser(), hospitalId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<SlotResponse>>> getSlots(
			@PathVariable Long hospitalId, @RequestParam(required = false) SlotStatus status,
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(slotService.getSlots(hospitalId, status, pageable)));
	}
}
