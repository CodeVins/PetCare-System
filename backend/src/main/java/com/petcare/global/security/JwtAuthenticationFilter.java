package com.petcare.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final String HEADER = "Authorization";
	private static final String PREFIX = "Bearer ";

	private final JwtTokenProvider jwtTokenProvider;
	private final CustomUserDetailsService userDetailsService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String token = resolveToken(request);

		if (StringUtils.hasText(token) && jwtTokenProvider.isValid(token)) {
			CustomUserDetails userDetails = userDetailsService.loadUserByUsername(jwtTokenProvider.getEmail(token));
			// 변경(2026-09-27): 정지 계정은 인증을 세팅하지 않음(→ 401) — 어차피 매 요청마다 유저를 DB에서 읽고 있어서
			// 추가 비용 없이 정지를 즉시 반영 가능 (이전: 로그인 시점에만 체크, 기존 accessToken은 최대 1시간 계속 유효)
			if (!userDetails.getUser().isSuspended()) {
				UsernamePasswordAuthenticationToken authentication =
						new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(authentication);
			}
		}

		filterChain.doFilter(request, response);
	}

	private String resolveToken(HttpServletRequest request) {
		String header = request.getHeader(HEADER);
		if (StringUtils.hasText(header) && header.startsWith(PREFIX)) {
			return header.substring(PREFIX.length());
		}

		// 브라우저 EventSource는 커스텀 헤더를 못 보내므로, SSE 구독 경로만 쿼리파라미터 토큰 허용
		if (request.getRequestURI().equals("/api/notifications/subscribe")) {
			return request.getParameter("token");
		}
		return null;
	}
}
