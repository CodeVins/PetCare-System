package com.petcare.domain.healthcheck;

import com.petcare.domain.healthcheck.dto.HealthCheckResultResponse;
import com.petcare.domain.healthcheck.dto.HealthCheckSubmitRequest;
import com.petcare.domain.healthcheck.dto.Question;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health-check")
@RequiredArgsConstructor
public class HealthCheckController {

	private final HealthCheckService healthCheckService;

	@GetMapping("/questions")
	public ResponseEntity<ApiResponse<List<Question>>> getQuestions() {
		return ResponseEntity.ok(ApiResponse.success(healthCheckService.getQuestions()));
	}

	@PostMapping("/submit")
	public ResponseEntity<ApiResponse<HealthCheckResultResponse>> submit(
			@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody HealthCheckSubmitRequest request) {
		return ResponseEntity.ok(ApiResponse.success(healthCheckService.submit(userDetails.getUser().getId(), request)));
	}
}
