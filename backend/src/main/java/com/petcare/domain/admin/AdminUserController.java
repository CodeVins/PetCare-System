package com.petcare.domain.admin;

import com.petcare.domain.admin.dto.RoleUpdateRequest;
import com.petcare.domain.user.dto.UserResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

	private final AdminUserService adminUserService;

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(adminUserService.getAllUsers(pageable)));
	}

	@PatchMapping("/{userId}/role")
	public ResponseEntity<ApiResponse<UserResponse>> updateRole(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long userId,
			@Valid @RequestBody RoleUpdateRequest request) {
		UserResponse response = adminUserService.updateRole(userDetails.getUser().getId(), userId, request.role());
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@PatchMapping("/{userId}/suspend")
	public ResponseEntity<ApiResponse<UserResponse>> suspend(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long userId) {
		UserResponse response = adminUserService.suspend(userDetails.getUser().getId(), userId);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@PatchMapping("/{userId}/activate")
	public ResponseEntity<ApiResponse<UserResponse>> activate(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long userId) {
		UserResponse response = adminUserService.activate(userDetails.getUser().getId(), userId);
		return ResponseEntity.ok(ApiResponse.success(response));
	}
}
