package com.petcare.domain.admin;

import com.petcare.domain.admin.dto.HospitalStatsResponse;
import com.petcare.domain.admin.dto.StatsSummaryResponse;
import com.petcare.global.common.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatsController {

	private final AdminStatsService adminStatsService;

	@GetMapping("/summary")
	public ResponseEntity<ApiResponse<StatsSummaryResponse>> getSummary() {
		return ResponseEntity.ok(ApiResponse.success(adminStatsService.getSummary()));
	}

	@GetMapping("/hospitals")
	public ResponseEntity<ApiResponse<List<HospitalStatsResponse>>> getHospitalStats() {
		return ResponseEntity.ok(ApiResponse.success(adminStatsService.getHospitalStats()));
	}
}
