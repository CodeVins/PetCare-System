package com.petcare.domain.user;

import com.petcare.domain.user.dto.LoginRequest;
import com.petcare.domain.user.dto.SignupRequest;
import com.petcare.domain.user.dto.SignupResponse;
import com.petcare.domain.user.dto.TokenResponse;
import com.petcare.global.exception.DuplicateEmailException;
import com.petcare.global.exception.InvalidCredentialsException;
import com.petcare.global.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

	private final UserRepository userRepository;
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

	public TokenResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(request.email())
				.orElseThrow(InvalidCredentialsException::new);

		if (!passwordEncoder.matches(request.password(), user.getPassword())) {
			throw new InvalidCredentialsException();
		}

		String accessToken = jwtTokenProvider.generateToken(user.getEmail());
		return new TokenResponse(accessToken, jwtTokenProvider.getExpiration());
	}
}
