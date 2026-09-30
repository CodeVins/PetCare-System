package com.petcare;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
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
				.andExpect(status().isOk());

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
	void 비회원은_병원_조회만_가능하고_그_외는_401() throws Exception {
		mockMvc.perform(get("/api/hospitals")).andExpect(status().isOk());
		mockMvc.perform(get("/api/hospitals/999999/reviews")).andExpect(status().isOk());
		mockMvc.perform(get("/api/hospitals/999999/slots")).andExpect(status().isOk());

		mockMvc.perform(post("/api/hospitals/1/favorites")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/reservations")).andExpect(status().isUnauthorized());
	}
}
