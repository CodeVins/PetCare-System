package com.petcare.domain.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

// 카카오 OAuth(인가 코드 방식) — 인가 URL 생성, 코드 → 카카오 토큰 → 사용자 정보.
// 카카오 토큰은 사용자 정보 조회에만 쓰고 저장하지 않음(로그인 후엔 우리 JWT만 사용)
@Component
public class KakaoOAuthClient {

	private static final String AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
	private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
	private static final String USER_URL = "https://kapi.kakao.com/v2/user/me";

	private final RestClient restClient;
	private final String restApiKey;
	private final String clientSecret;
	private final String redirectUri;

	public KakaoOAuthClient(
			@Value("${app.kakao.rest-api-key}") String restApiKey,
			@Value("${app.kakao.client-secret}") String clientSecret,
			@Value("${app.kakao.redirect-uri}") String redirectUri) {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(Duration.ofSeconds(3));
		factory.setReadTimeout(Duration.ofSeconds(5));
		this.restClient = RestClient.builder().requestFactory(factory).build();
		this.restApiKey = restApiKey;
		this.clientSecret = clientSecret;
		this.redirectUri = redirectUri;
	}

	public String authorizeUrl(String state) {
		requireKey();
		return UriComponentsBuilder.fromUriString(AUTHORIZE_URL)
				.queryParam("response_type", "code")
				.queryParam("client_id", restApiKey)
				.queryParam("redirect_uri", redirectUri)
				.queryParam("state", state)
				.encode()
				.toUriString();
	}

	// 실패하면 RestClientException(잘못된·재사용된 코드, 카카오 장애 등)
	public KakaoUser fetchUser(String code) {
		requireKey();
		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("grant_type", "authorization_code");
		form.add("client_id", restApiKey);
		form.add("redirect_uri", redirectUri);
		form.add("code", code);
		if (!clientSecret.isBlank()) {
			form.add("client_secret", clientSecret);
		}
		TokenResponse token = restClient.post().uri(TOKEN_URL)
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(form)
				.retrieve()
				.body(TokenResponse.class);
		UserResponse user = restClient.get().uri(USER_URL)
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + token.accessToken())
				.retrieve()
				.body(UserResponse.class);
		return new KakaoUser(user.id(), user.verifiedEmail());
	}

	private void requireKey() {
		if (restApiKey.isBlank()) {
			throw new IllegalStateException("KAKAO_REST_API_KEY가 설정되지 않았습니다.");
		}
	}

	// email: 카카오가 인증·유효하다고 확인한 이메일만(동의 안 했거나 미인증이면 null)
	public record KakaoUser(long id, String email) {
	}

	record TokenResponse(@JsonProperty("access_token") String accessToken) {
	}

	record UserResponse(long id, @JsonProperty("kakao_account") Account account) {

		String verifiedEmail() {
			if (account == null || account.email() == null) {
				return null;
			}
			return Boolean.TRUE.equals(account.emailValid()) && Boolean.TRUE.equals(account.emailVerified())
					? account.email()
					: null;
		}
	}

	record Account(
			String email,
			@JsonProperty("is_email_valid") Boolean emailValid,
			@JsonProperty("is_email_verified") Boolean emailVerified) {
	}
}
