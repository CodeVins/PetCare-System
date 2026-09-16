package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.SlotCreateRequest;
import com.petcare.domain.hospital.dto.SlotResponse;
import com.petcare.global.common.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<SlotResponse>> create(
			@PathVariable Long hospitalId, @Valid @RequestBody SlotCreateRequest request) {
		SlotResponse response = slotService.create(hospitalId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<SlotResponse>>> getSlots(
			@PathVariable Long hospitalId, @RequestParam(required = false) SlotStatus status) {
		return ResponseEntity.ok(ApiResponse.success(slotService.getSlots(hospitalId, status)));
	}
}
