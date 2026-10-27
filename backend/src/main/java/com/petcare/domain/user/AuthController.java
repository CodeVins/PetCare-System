package com.petcare.domain.user;

import com.petcare.domain.user.dto.KakaoLoginRequest;
import com.petcare.domain.user.dto.LoginRequest;
import com.petcare.domain.user.dto.PasswordResetConfirmRequest;
import com.petcare.domain.user.dto.PasswordResetRequestRequest;
import com.petcare.domain.user.dto.RefreshTokenRequest;
import com.petcare.domain.user.dto.SignupRequest;
import com.petcare.domain.user.dto.SignupResponse;
import com.petcare.domain.user.dto.TokenResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;
	private final PasswordResetService passwordResetService;
	private final KakaoOAuthClient kakaoOAuthClient;

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

	// 카카오 인가 페이지로 보냄 — state는 프론트가 만들어 콜백에서 같은지 확인(CSRF 방지), 키는 서버에만
	@GetMapping("/kakao/login")
	public ResponseEntity<Void> kakaoAuthorize(@RequestParam String state) {
		return ResponseEntity.status(HttpStatus.FOUND)
				.location(URI.create(kakaoOAuthClient.authorizeUrl(state)))
				.build();
	}

	@PostMapping("/kakao")
	public ResponseEntity<ApiResponse<TokenResponse>> kakaoLogin(@Valid @RequestBody KakaoLoginRequest request) {
		return ResponseEntity.ok(ApiResponse.success(authService.kakaoLogin(request.code())));
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

	@PostMapping("/password-reset/request")
	public ResponseEntity<ApiResponse<Void>> requestPasswordReset(@Valid @RequestBody PasswordResetRequestRequest request) {
		passwordResetService.requestReset(request.email());
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PostMapping("/password-reset/confirm")
	public ResponseEntity<ApiResponse<Void>> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
		passwordResetService.confirmReset(request.token(), request.newPassword());
		return ResponseEntity.ok(ApiResponse.success());
	}
}
