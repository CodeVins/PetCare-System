package com.petcare.global.security;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private static final String[] PERMIT_ALL_PATHS = {
			"/api/auth/signup",
			"/api/auth/login",
			"/api/auth/reissue",
			"/api/auth/password-reset/**",
			"/swagger-ui/**",
			"/v3/api-docs/**",
			"/uploads/**",
			// 변경(2026-10-02): 채팅 WebSocket 핸드셰이크 — 브라우저 WebSocket은 커스텀 헤더를 못 보내서 HTTP 단계는 열고
			// STOMP CONNECT 프레임에서 JWT 검증(ChatStompInterceptor) (이전: 없음)
			"/api/ws",
			// 변경(2026-10-05): 외부 장애 감시용 헬스체크 공개 — 상태(UP/DOWN)만 응답하고 상세는 숨김 (이전: 없음)
			"/api/health"
	};

	// 변경(2026-09-27): 비회원도 병원 목록/상세/리뷰/예약 가능 슬롯을 볼 수 있게 GET만 공개 — 프론트 랜딩·병원 둘러보기용
	// (이전: auth/swagger/uploads 외 전부 인증 필요라 첫 화면부터 로그인으로 튕김). 하위 경로를 **로 열지 않고
	// 명시한 건 나중에 /api/hospitals 아래 GET이 추가돼도 실수로 공개되지 않게 하려는 것
	private static final String[] PUBLIC_GET_PATHS = {
			"/api/hospitals",
			"/api/hospitals/*",
			"/api/hospitals/*/reviews",
			"/api/hospitals/*/slots"
	};

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		// ponytail: patterns (not exact origins) so a phone on the same Wi-Fi hitting
		// the dev server's LAN IP (e.g. http://192.168.0.12:5173) is allowed too,
		// without hardcoding one machine's IP.
		config.setAllowedOriginPatterns(List.of(
				"http://localhost:5173",
				"http://localhost:3000",
				"http://192.168.*.*:5173",
				"http://10.*.*.*:5173",
				"http://172.*.*.*:5173"));
		config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(PERMIT_ALL_PATHS).permitAll()
						.requestMatchers(HttpMethod.GET, PUBLIC_GET_PATHS).permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
