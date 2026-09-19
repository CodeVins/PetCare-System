package com.petcare.domain.user;

import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// ponytail: 실제 이메일 발송 서비스가 없어서 재설정 링크를 로그로만 출력한다.
// SMTP/이메일 서비스 붙일 때 log.info 부분을 실제 발송 코드로 교체할 것.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PasswordResetService {

	private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
	private static final long EXPIRATION_MINUTES = 30;

	private final UserRepository userRepository;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final PasswordEncoder passwordEncoder;

	@Transactional
	public void requestReset(String email) {
		userRepository.findByEmail(email).ifPresent(user -> {
			String token = UUID.randomUUID().toString();
			PasswordResetToken resetToken = PasswordResetToken.builder()
					.user(user)
					.token(token)
					.expiresAt(LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES))
					.build();
			passwordResetTokenRepository.save(resetToken);

			log.info("[비밀번호 재설정] {}에게 발송될 링크 (실제 이메일 발송 미구현): /reset-password?token={}", email, token);
		});
		// 이메일 존재 여부를 노출하지 않기 위해 결과와 무관하게 항상 정상 응답
	}

	@Transactional
	public void confirmReset(String token, String newPassword) {
		PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
				.orElseThrow(() -> new NotFoundException("유효하지 않은 토큰입니다."));
		if (!resetToken.isUsable()) {
			throw new ConflictException("만료되었거나 이미 사용된 토큰입니다.");
		}

		resetToken.getUser().changePassword(passwordEncoder.encode(newPassword));
		resetToken.markUsed();
	}
}
