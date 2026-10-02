package com.petcare;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(RedisTestConfig.class)
class AuthFlowTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void 회원가입_후_로그인하고_중복가입과_잘못된_비밀번호는_거부된다() throws Exception {
		String email = "flow@petcare.com";

		mockMvc.perform(post("/api/auth/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.email").value(email));

		mockMvc.perform(post("/api/auth/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
				.andExpect(status().isConflict());

		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"wrongpassword\"}"))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.accessToken").exists())
				.andExpect(jsonPath("$.data.refreshToken").exists());
	}

	@Test
	void 로그인_5회_실패하면_올바른_비밀번호여도_429() throws Exception {
		String email = "ratelimit" + System.nanoTime() + "@petcare.com";
		mockMvc.perform(post("/api/auth/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
				.andExpect(status().isCreated());

		// 성공하면 실패 횟수 초기화 — 4번 틀리고 성공한 뒤 다시 4번 틀려도 아직 안 막힘
		for (int i = 0; i < 4; i++) {
			login(email, "wrongpassword").andExpect(status().isUnauthorized());
		}
		login(email, "password123").andExpect(status().isOk());
		for (int i = 0; i < 4; i++) {
			login(email, "wrongpassword").andExpect(status().isUnauthorized());
		}
		login(email, "password123").andExpect(status().isOk());

		// 대소문자만 바꾼 이메일도 같은 카운터로 집계
		for (int i = 0; i < 5; i++) {
			login(i % 2 == 0 ? email : email.toUpperCase(), "wrongpassword").andExpect(status().isUnauthorized());
		}
		login(email, "password123").andExpect(status().isTooManyRequests());
	}

	private ResultActions login(String email, String password) throws Exception {
		return mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
	}

	@Test
	void 비회원은_병원_조회만_가능하고_그_외는_401() throws Exception {
		mockMvc.perform(get("/api/hospitals")).andExpect(status().isOk());
		mockMvc.perform(get("/api/hospitals/999999/reviews")).andExpect(status().isOk());
		mockMvc.perform(get("/api/hospitals/999999/slots")).andExpect(status().isOk());

		mockMvc.perform(post("/api/hospitals/1/favorites")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/reservations")).andExpect(status().isUnauthorized());
	}
}
