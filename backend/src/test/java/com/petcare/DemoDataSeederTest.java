package com.petcare;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.hospital.HospitalRepository;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.global.demo.DemoDataSeeder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

// 데모 시더는 app.demo.enabled=true일 때만 빈이 생겨서 별도 컨텍스트로 띄움 — 앱 시작 시 ApplicationRunner가 이미 한 번 돌았음
@SpringBootTest(properties = "app.demo.enabled=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(RedisTestConfig.class)
class DemoDataSeederTest {

	@Autowired private MockMvc mockMvc;
	@Autowired private ObjectMapper objectMapper;
	@Autowired private DemoDataSeeder seeder;
	@Autowired private HospitalRepository hospitalRepository;
	@Autowired private SlotRepository slotRepository;

	@Test
	void 데모_병원과_슬롯_리뷰가_생기고_다시_돌려도_중복되지_않는다() throws Exception {
		List<Hospital> demo = demoHospitals();
		assertThat(demo).hasSize(15);
		long slotsBefore = slotRepository.count();

		seeder.seedIfAbsent();
		assertThat(seeder.topUpSlots()).isZero(); // 이미 다 채워져 있음
		assertThat(demoHospitals()).hasSize(15);
		assertThat(slotRepository.count()).isEqualTo(slotsBefore);

		// 공개 API로 보이는 모습 확인 — 커버 이미지 파일, 프로필, 진료 시간, 앞으로의 슬롯
		JsonNode list = data(mockMvc.perform(get("/api/hospitals?keyword=동물")).andReturn().getResponse().getContentAsString());
		JsonNode first = list.get(0);
		assertThat(first.get("phone").asText()).startsWith("02-0000-");
		assertThat(first.get("description").asText()).contains("데모용 가상 병원");
		String imageUrl = first.get("imageUrl").asText();
		assertThat(Files.size(Path.of("build/test-uploads-hospitals", imageUrl.substring(imageUrl.lastIndexOf('/') + 1))))
				.isGreaterThan(1000);
		mockMvc.perform(get(imageUrl)).andExpect(status().isOk());

		int withHours = 0;
		int withReviews = 0;
		for (JsonNode hospital : list) {
			if (!hospital.get("weeklyHours").isEmpty() || hospital.get("is24Hours").asBoolean()) {
				withHours++;
			}
			if (hospital.get("reviewCount").asLong() > 0) {
				withReviews++;
			}
			JsonNode slots = data(mockMvc.perform(get("/api/hospitals/" + hospital.get("id").asLong() + "/slots"))
					.andReturn().getResponse().getContentAsString()).get("content");
			for (JsonNode slot : slots) {
				assertThat(LocalDateTime.parse(slot.get("startTime").asText())).isAfter(LocalDateTime.now());
			}
		}
		assertThat(withHours).isEqualTo(list.size());
		assertThat(withReviews).isGreaterThan(5);

		// 리뷰 작성 계정은 로그인 불가(정지 + 랜덤 비밀번호) — 공개 데모 계정이 아님
		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"demo-reviewer-1@petcare.invalid\",\"password\":\"password\"}"))
				.andExpect(status().isUnauthorized());
	}

	private List<Hospital> demoHospitals() {
		return hospitalRepository.findAll().stream()
				.filter(h -> h.getPhone() != null && h.getPhone().startsWith("02-0000-"))
				.toList();
	}

	private JsonNode data(String body) throws Exception {
		return objectMapper.readTree(body).get("data");
	}
}
