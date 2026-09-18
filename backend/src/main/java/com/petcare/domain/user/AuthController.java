package com.petcare.domain.user;

import com.petcare.domain.user.dto.LoginRequest;
import com.petcare.domain.user.dto.RefreshTokenRequest;
import com.petcare.domain.user.dto.SignupRequest;
import com.petcare.domain.user.dto.SignupResponse;
import com.petcare.domain.user.dto.TokenResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/signup")
	public ResponseEntity<ApiResponse<SignupResponse>> signup(@Valid @RequestBody SignupRequest request) {
		SignupResponse response = authService.signup(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
		TokenResponse response = authService.login(request);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@PostMapping("/reissue")
	public ResponseEntity<ApiResponse<TokenResponse>> reissue(@Valid @RequestBody RefreshTokenRequest request) {
		TokenResponse response = authService.reissue(request);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@PostMapping("/logout")
	public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal CustomUserDetails userDetails) {
		authService.logout(userDetails.getUser().getId());
		return ResponseEntity.ok(ApiResponse.success());
	}
}
