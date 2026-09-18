package com.petcare;

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
}
