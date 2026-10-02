package com.petcare.domain.user;

import com.petcare.domain.user.dto.LoginRequest;
import com.petcare.domain.user.dto.RefreshTokenRequest;
import com.petcare.domain.user.dto.SignupRequest;
import com.petcare.domain.user.dto.SignupResponse;
import com.petcare.domain.user.dto.TokenResponse;
import com.petcare.global.exception.DuplicateEmailException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.InvalidCredentialsException;
import com.petcare.global.security.JwtTokenProvider;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;
	private final LoginAttemptService loginAttemptService;

	@Transactional
	public SignupResponse signup(SignupRequest request) {
		if (userRepository.existsByEmail(request.email())) {
			throw new DuplicateEmailException(request.email());
		}

		User user = User.builder()
				.email(request.email())
				.password(passwordEncoder.encode(request.password()))
				.role(Role.USER)
				.build();

		return SignupResponse.from(userRepository.save(user));
	}

	@Transactional
	public TokenResponse login(LoginRequest request) {
		// 변경(2026-10-02): 이메일별 로그인 실패 5회 시 15분 차단(429), 성공하면 횟수 초기화 — 무차별 대입 방지
		// (이전: 실패 횟수 제한 없이 비밀번호를 무한 시도 가능). 없는 이메일도 실패로 세서 응답으로 계정 존재 여부가 안 드러나게
		loginAttemptService.checkBlocked(request.email());

		User user = userRepository.findByEmail(request.email()).orElse(null);
		if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
			loginAttemptService.recordFailure(request.email());
			throw new InvalidCredentialsException();
		}
		loginAttemptService.reset(request.email());
		if (user.isSuspended()) {
			throw new ForbiddenException("정지된 계정입니다. 관리자에게 문의해주세요.");
		}

		return issueTokens(user);
	}

	@Transactional
	public TokenResponse reissue(RefreshTokenRequest request) {
		RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
				.orElseThrow(() -> new InvalidCredentialsException("유효하지 않은 refreshToken입니다."));

		if (refreshToken.isExpired()) {
			refreshTokenRepository.delete(refreshToken);
			throw new InvalidCredentialsException("만료된 refreshToken입니다. 다시 로그인해주세요.");
		}
		// 변경(2026-09-27): 정지 계정 재발급 차단 (이전: 로그인만 막아서 정지돼도 refreshToken으로 14일간 계속 재발급 가능)
		if (refreshToken.getUser().isSuspended()) {
			throw new ForbiddenException("정지된 계정입니다. 관리자에게 문의해주세요.");
		}

		return issueTokens(refreshToken.getUser());
	}

	@Transactional
	public void logout(Long userId) {
		refreshTokenRepository.deleteByUserId(userId);
	}

	private TokenResponse issueTokens(User user) {
		String accessToken = jwtTokenProvider.generateToken(user.getEmail());

		String refreshTokenValue = UUID.randomUUID().toString();
		LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(jwtTokenProvider.getRefreshExpiration() / 1000);
		RefreshToken refreshToken = refreshTokenRepository.findByUserId(user.getId())
				.orElse(RefreshToken.builder().user(user).token(refreshTokenValue).expiresAt(expiresAt).build());
		refreshToken.rotate(refreshTokenValue, expiresAt);
		refreshTokenRepository.save(refreshToken);

		return new TokenResponse(accessToken, refreshTokenValue, jwtTokenProvider.getExpiration());
	}
}
