package com.petcare.domain.admin;

import com.petcare.domain.admin.dto.HospitalOwnerUpdateRequest;
import com.petcare.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/hospitals")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminHospitalController {

	private final AdminHospitalService adminHospitalService;

	@PatchMapping("/{hospitalId}/owner")
	public ResponseEntity<ApiResponse<Void>> updateOwner(
			@PathVariable Long hospitalId, @Valid @RequestBody HospitalOwnerUpdateRequest request) {
		adminHospitalService.updateOwner(hospitalId, request.ownerId());
		return ResponseEntity.ok(ApiResponse.success());
	}
}
