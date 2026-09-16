package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.HealthRecordCreateRequest;
import com.petcare.domain.pet.dto.HealthRecordResponse;
import com.petcare.domain.pet.dto.HealthRecordUpdateRequest;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/pets/{petId}/health-records")
@RequiredArgsConstructor
public class HealthRecordController {

	private final HealthRecordService healthRecordService;

	@PostMapping
	public ResponseEntity<ApiResponse<HealthRecordResponse>> create(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@Valid @RequestBody HealthRecordCreateRequest request) {
		HealthRecordResponse response = healthRecordService.create(userDetails.getUser().getId(), petId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<HealthRecordResponse>>> getRecords(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId) {
		return ResponseEntity.ok(ApiResponse.success(healthRecordService.getRecords(userDetails.getUser().getId(), petId)));
	}

	@PatchMapping("/{recordId}")
	public ResponseEntity<ApiResponse<HealthRecordResponse>> update(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@PathVariable Long recordId, @Valid @RequestBody HealthRecordUpdateRequest request) {
		HealthRecordResponse response =
				healthRecordService.update(userDetails.getUser().getId(), petId, recordId, request);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@DeleteMapping("/{recordId}")
	public ResponseEntity<ApiResponse<Void>> delete(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@PathVariable Long recordId) {
		healthRecordService.delete(userDetails.getUser().getId(), petId, recordId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
