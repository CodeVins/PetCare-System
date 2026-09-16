package com.petcare.domain.user;

import com.petcare.domain.pet.dto.UpcomingVaccinationResponse;
import com.petcare.domain.user.dto.EmailUpdateRequest;
import com.petcare.domain.user.dto.PasswordChangeRequest;
import com.petcare.domain.user.dto.UserResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping
	public ResponseEntity<ApiResponse<UserResponse>> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
		return ResponseEntity.ok(ApiResponse.success(userService.getMe(userDetails.getUser().getId())));
	}

	@PatchMapping
	public ResponseEntity<ApiResponse<UserResponse>> updateEmail(
			@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody EmailUpdateRequest request) {
		return ResponseEntity.ok(ApiResponse.success(userService.updateEmail(userDetails.getUser().getId(), request)));
	}

	@PatchMapping("/password")
	public ResponseEntity<ApiResponse<Void>> changePassword(
			@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody PasswordChangeRequest request) {
		userService.changePassword(userDetails.getUser().getId(), request);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@GetMapping("/upcoming-vaccinations")
	public ResponseEntity<ApiResponse<List<UpcomingVaccinationResponse>>> getUpcomingVaccinations(
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		return ResponseEntity.ok(
				ApiResponse.success(userService.getUpcomingVaccinations(userDetails.getUser().getId())));
	}
}
