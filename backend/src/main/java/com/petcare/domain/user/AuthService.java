package com.petcare.domain.user;

import com.petcare.domain.user.KakaoOAuthClient.KakaoUser;
import com.petcare.domain.user.dto.LoginRequest;
import com.petcare.domain.user.dto.RefreshTokenRequest;
import com.petcare.domain.user.dto.SignupRequest;
import com.petcare.domain.user.dto.SignupResponse;
import com.petcare.domain.user.dto.TokenResponse;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.DuplicateEmailException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.InvalidCredentialsException;
import com.petcare.global.security.JwtTokenProvider;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;
	private final LoginAttemptService loginAttemptService;
	private final KakaoOAuthClient kakaoOAuthClient;

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

	// 카카오 회원번호로 찾고 → 없으면 카카오가 인증한 이메일과 같은 기존 계정에 연결 → 그것도 없으면 가입
	@Transactional
	public TokenResponse kakaoLogin(String code) {
		KakaoUser kakao;
		try {
			kakao = kakaoOAuthClient.fetchUser(code);
		} catch (RestClientException e) {
			// 카카오 에러 코드(KOE010 등)는 응답 본문에만 있어서 같이 남김 — 메시지만으론 "401 [no body]"
			String body = e instanceof RestClientResponseException re ? re.getResponseBodyAsString() : "";
			log.warn("[카카오 로그인] 사용자 정보 조회 실패: {} {}", e.getMessage(), body);
			throw new InvalidCredentialsException("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
		}

		User user = userRepository.findByKakaoId(kakao.id())
				.orElseGet(() -> linkOrCreateKakaoUser(kakao));
		if (user.isSuspended()) {
			throw new ForbiddenException("정지된 계정입니다. 관리자에게 문의해주세요.");
		}
		return issueTokens(user);
	}

	private User linkOrCreateKakaoUser(KakaoUser kakao) {
		User existing = kakao.email() == null ? null : userRepository.findByEmail(kakao.email()).orElse(null);
		if (existing != null) {
			if (existing.getKakaoId() != null) {
				throw new ConflictException("이 이메일은 다른 카카오 계정과 연결되어 있습니다.");
			}
			existing.linkKakao(kakao.id());
			return existing;
		}
		// 이메일 동의를 안 받았거나 미인증이면 로그인 불가 도메인(.invalid)의 자리표시 이메일 — JWT subject가 이메일이라 필요
		String email = kakao.email() != null ? kakao.email() : "kakao-" + kakao.id() + "@petcare.invalid";
		return userRepository.save(User.builder()
				.email(email)
				// 비밀번호 로그인은 안 쓰는 계정 — 아무도 모르는 랜덤 값
				.password(passwordEncoder.encode(UUID.randomUUID().toString()))
				.role(Role.USER)
				.kakaoId(kakao.id())
				.build());
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
