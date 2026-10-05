package com.petcare.domain.admin;

import com.petcare.domain.admin.dto.HospitalPeriodStatsResponse;
import com.petcare.domain.admin.dto.HospitalStatsResponse;
import com.petcare.domain.admin.dto.StatsSummaryResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

	// 병원 하나의 최근 N일 통계 — 클래스는 ADMIN 전용이지만 이 메서드만 병원 소유자에게도 열고(메서드 애너테이션이 우선),
	// 서비스에서 본인 병원인지 다시 확인
	@GetMapping("/hospitals/{hospitalId}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('HOSPITAL_OWNER')")
	public ResponseEntity<ApiResponse<HospitalPeriodStatsResponse>> getHospitalPeriodStats(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId,
			@RequestParam(defaultValue = "30") int days) {
		return ResponseEntity.ok(ApiResponse.success(
				adminStatsService.getHospitalPeriodStats(userDetails.getUser(), hospitalId, days)));
	}
}
