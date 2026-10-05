package com.petcare;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(RedisTestConfig.class)
class ReservationFlowTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private String adminToken;
	private String userToken;
	private long hospitalId;

	@BeforeEach
	void setUp() throws Exception {
		String suffix = System.nanoTime() + "";
		String adminEmail = "admin-flow-" + suffix + "@petcare.com";
		String userEmail = "user-flow-" + suffix + "@petcare.com";

		userRepository.save(User.builder()
				.email(adminEmail)
				.password(passwordEncoder.encode("adminpass123"))
				.role(Role.ADMIN)
				.build());
		adminToken = login(adminEmail, "adminpass123");

		signup(userEmail, "password123");
		userToken = login(userEmail, "password123");

		hospitalId = createHospital();
	}

	@Test
	void 예약을_생성하면_PENDING이고_관리자가_확정하면_CONFIRMED가_된다() throws Exception {
		long petId = createPet("테스트펫");
		long slotId = createSlot(hospitalId, "2027-01-01T10:00:00", "2027-01-01T10:30:00");

		long reservationId = createReservation(petId, slotId);

		mockMvc.perform(get("/api/reservations/" + reservationId).header("Authorization", "Bearer " + userToken))
				.andExpect(jsonPath("$.data.status").value("PENDING"));

		mockMvc.perform(patch("/api/admin/reservations/" + reservationId + "/confirm")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/reservations/" + reservationId).header("Authorization", "Bearer " + userToken))
				.andExpect(jsonPath("$.data.status").value("CONFIRMED"));
	}

	@Test
	void 같은_슬롯에_동시에_예약을_시도하면_하나만_성공한다() throws Exception {
		long petId = createPet("동시성펫");
		long slotId = createSlot(hospitalId, "2027-02-01T10:00:00", "2027-02-01T10:30:00");

		int threadCount = 5;
		ExecutorService executor = Executors.newFixedThreadPool(threadCount);
		CountDownLatch latch = new CountDownLatch(threadCount);
		AtomicInteger successCount = new AtomicInteger();

		for (int i = 0; i < threadCount; i++) {
			executor.submit(() -> {
				try {
					MvcResult result = mockMvc.perform(post("/api/reservations")
									.header("Authorization", "Bearer " + userToken)
									.contentType(MediaType.APPLICATION_JSON)
									.content("{\"petId\":" + petId + ",\"slotId\":" + slotId + ",\"type\":\"CHECKUP\"}"))
							.andReturn();
					if (result.getResponse().getStatus() == 201) {
						successCount.incrementAndGet();
					}
				} catch (Exception e) {
					throw new RuntimeException(e);
				} finally {
					latch.countDown();
				}
			});
		}

		latch.await(10, TimeUnit.SECONDS);
		executor.shutdown();

		assertThat(successCount.get()).isEqualTo(1);
	}

	@Test
	void 시간_변경과_새_예약이_같은_슬롯을_동시에_노리면_하나만_성공한다() throws Exception {
		long petId = createPet("변경펫");
		long oldSlotId = createSlot(hospitalId, "2027-03-01T10:00:00", "2027-03-01T10:30:00");
		long targetSlotId = createSlot(hospitalId, "2027-03-01T11:00:00", "2027-03-01T11:30:00");
		MvcResult created = mockMvc.perform(post("/api/reservations")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"petId\":" + petId + ",\"slotId\":" + oldSlotId + ",\"type\":\"CHECKUP\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		long reservationId = extractId(created);

		// 1개 스레드는 기존 예약을 targetSlot으로 변경, 나머지는 targetSlot에 새로 예약
		int threadCount = 5;
		ExecutorService executor = Executors.newFixedThreadPool(threadCount);
		CountDownLatch ready = new CountDownLatch(threadCount);
		CountDownLatch start = new CountDownLatch(1);
		CountDownLatch done = new CountDownLatch(threadCount);
		AtomicInteger successCount = new AtomicInteger();
		AtomicInteger rescheduleStatus = new AtomicInteger();

		for (int i = 0; i < threadCount; i++) {
			boolean isReschedule = i == 0;
			executor.submit(() -> {
				try {
					ready.countDown();
					start.await();
					MvcResult result = mockMvc.perform(isReschedule
									? patch("/api/reservations/" + reservationId + "/reschedule")
											.header("Authorization", "Bearer " + userToken)
											.contentType(MediaType.APPLICATION_JSON)
											.content("{\"slotId\":" + targetSlotId + "}")
									: post("/api/reservations")
											.header("Authorization", "Bearer " + userToken)
											.contentType(MediaType.APPLICATION_JSON)
											.content("{\"petId\":" + petId + ",\"slotId\":" + targetSlotId
													+ ",\"type\":\"CHECKUP\"}"))
							.andReturn();
					int code = result.getResponse().getStatus();
					if (isReschedule) {
						rescheduleStatus.set(code);
					}
					if (code == 200 || code == 201) {
						successCount.incrementAndGet();
					}
				} catch (Exception e) {
					throw new RuntimeException(e);
				} finally {
					done.countDown();
				}
			});
		}
		ready.await(5, TimeUnit.SECONDS);
		start.countDown();
		done.await(10, TimeUnit.SECONDS);
		executor.shutdown();

		assertThat(successCount.get()).isEqualTo(1);
		// 변경이 졌다면 기존 예약은 원래 슬롯 그대로여야 함(반쯤 옮겨진 상태 없음)
		long expectedSlot = rescheduleStatus.get() == 200 ? targetSlotId : oldSlotId;
		mockMvc.perform(get("/api/reservations/" + reservationId).header("Authorization", "Bearer " + userToken))
				.andExpect(jsonPath("$.data.slotId").value(expectedSlot));
	}

	private void signup(String email, String password) throws Exception {
		mockMvc.perform(post("/api/auth/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
				.andExpect(status().isCreated());
	}

	private String login(String email, String password) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
				.andExpect(status().isOk())
				.andReturn();
		return extractField(result, "accessToken");
	}

	private long createHospital() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/hospitals")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"통합테스트병원\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		return extractId(result);
	}

	private long createPet(String name) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/pets")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"" + name + "\",\"species\":\"DOG\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		return extractId(result);
	}

	private long createSlot(long hospitalId, String startTime, String endTime) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/hospitals/" + hospitalId + "/slots")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"startTime\":\"" + startTime + "\",\"endTime\":\"" + endTime + "\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		return extractId(result);
	}

	private long createReservation(long petId, long slotId) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/reservations")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"petId\":" + petId + ",\"slotId\":" + slotId + ",\"type\":\"CHECKUP\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		return extractId(result);
	}

	private long extractId(MvcResult result) throws Exception {
		return Long.parseLong(extractField(result, "id"));
	}

	private String extractField(MvcResult result, String field) throws Exception {
		var json = objectMapper.readTree(result.getResponse().getContentAsString());
		return json.get("data").get(field).asText();
	}
}
