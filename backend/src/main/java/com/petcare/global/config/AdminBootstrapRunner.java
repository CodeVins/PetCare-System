package com.petcare.global.config;

import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminBootstrapRunner implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Value("${app.admin.bootstrap-email:}")
	private String bootstrapEmail;

	@Value("${app.admin.bootstrap-password:}")
	private String bootstrapPassword;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (bootstrapEmail.isBlank() || bootstrapPassword.isBlank()) {
			return;
		}

		User user = userRepository.findByEmail(bootstrapEmail).orElse(null);
		if (user == null) {
			userRepository.save(User.builder()
					.email(bootstrapEmail)
					.password(passwordEncoder.encode(bootstrapPassword))
					.role(Role.ADMIN)
					.build());
			log.info("관리자 계정 생성됨: {}", bootstrapEmail);
		} else if (user.getRole() != Role.ADMIN) {
			user.changeRole(Role.ADMIN);
			log.info("기존 계정을 관리자로 승격함: {}", bootstrapEmail);
		}
	}
}
