package com.petcare.domain.user;

import com.petcare.domain.user.dto.LoginRequest;
import com.petcare.domain.user.dto.RefreshTokenRequest;
import com.petcare.domain.user.dto.SignupRequest;
import com.petcare.domain.user.dto.SignupResponse;
import com.petcare.domain.user.dto.TokenResponse;
import com.petcare.global.exception.DuplicateEmailException;
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
		User user = userRepository.findByEmail(request.email())
				.orElseThrow(InvalidCredentialsException::new);

		if (!passwordEncoder.matches(request.password(), user.getPassword())) {
			throw new InvalidCredentialsException();
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
