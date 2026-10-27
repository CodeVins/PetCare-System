package com.petcare;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.petcare.domain.user.KakaoOAuthClient;
import com.petcare.domain.user.KakaoOAuthClient.KakaoUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestClientException;

// 카카오 API는 목으로 대체 — 계정 찾기/연결/가입 규칙만 검증
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(RedisTestConfig.class)
class KakaoLoginTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private KakaoOAuthClient kakaoOAuthClient;

	@Test
	void 처음이면_가입하고_다시_로그인하면_같은_계정() throws Exception {
		long kakaoId = System.nanoTime();
		String email = "kakao" + kakaoId + "@kakao.com";
		given(kakaoOAuthClient.fetchUser("code1")).willReturn(new KakaoUser(kakaoId, email));
		given(kakaoOAuthClient.fetchUser("code2")).willReturn(new KakaoUser(kakaoId, null));

		assertThat(myEmail(kakaoLogin("code1"))).isEqualTo(email);
		// 이메일 동의를 철회해도 회원번호로 같은 계정
		assertThat(myEmail(kakaoLogin("code2"))).isEqualTo(email);
	}

	@Test
	void 인증된_이메일이_같으면_기존_계정에_연결되고_이메일이_없으면_자리표시_이메일로_가입() throws Exception {
		String email = "local" + System.nanoTime() + "@petcare.com";
		mockMvc.perform(post("/api/auth/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
				.andExpect(status().isCreated());

		long kakaoId = System.nanoTime();
		given(kakaoOAuthClient.fetchUser("link")).willReturn(new KakaoUser(kakaoId, email));
		assertThat(myEmail(kakaoLogin("link"))).isEqualTo(email);

		// 같은 이메일을 다른 카카오 계정이 주장하면 409
		given(kakaoOAuthClient.fetchUser("other")).willReturn(new KakaoUser(kakaoId + 1, email));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"other\"}"))
				.andExpect(status().isConflict());

		long noEmailId = System.nanoTime();
		given(kakaoOAuthClient.fetchUser("noemail")).willReturn(new KakaoUser(noEmailId, null));
		assertThat(myEmail(kakaoLogin("noemail")))
				.isEqualTo("kakao-" + noEmailId + "@petcare.invalid");
	}

	@Test
	void 카카오_조회가_실패하면_401() throws Exception {
		given(kakaoOAuthClient.fetchUser("bad")).willThrow(new RestClientException("invalid_grant"));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"bad\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("카카오 로그인에 실패했습니다. 다시 시도해주세요."));
	}

	private String kakaoLogin(String code) throws Exception {
		String body = mockMvc.perform(post("/api/auth/kakao")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"code\":\"" + code + "\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.data.accessToken");
	}

	private String myEmail(String accessToken) throws Exception {
		String body = mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.data.email");
	}
}
