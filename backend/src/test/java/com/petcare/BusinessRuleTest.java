package com.petcare;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petcare.domain.hospital.HospitalRepository;
import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.ReservationType;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * 슬롯 시간 규칙(과거/겹침), 병원 관리 권한, 공동보호자 권한, 대기자 알림, 계정 정지 즉시 반영 검증.
 * 과거 시간 슬롯은 API로 만들 수 없게 막혀 있어서 레포지토리로 직접 저장한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BusinessRuleTest {

	@Autowired private MockMvc mockMvc;
	@Autowired private ObjectMapper objectMapper;
	@Autowired private UserRepository userRepository;
	@Autowired private PasswordEncoder passwordEncoder;
	@Autowired private HospitalRepository hospitalRepository;
	@Autowired private SlotRepository slotRepository;
	@Autowired private PetRepository petRepository;
	@Autowired private ReservationRepository reservationRepository;

	private String suffix;
	private String adminToken;
	private String userEmail;
	private String userToken;
	private long hospitalId;

	@BeforeEach
	void setUp() throws Exception {
		suffix = System.nanoTime() + "";
		String adminEmail = "admin-rule-" + suffix + "@petcare.com";
		userRepository.save(User.builder()
				.email(adminEmail)
				.password(passwordEncoder.encode("adminpass123"))
				.role(Role.ADMIN)
				.build());
		adminToken = login(adminEmail, "adminpass123");

		userEmail = "user-rule-" + suffix + "@petcare.com";
		userToken = signupAndLogin(userEmail);
		hospitalId = createHospital();
	}

	// ---------- 슬롯 시간 규칙 ----------

	@Test
	void 과거_시간_슬롯은_만들_수_없다() throws Exception {
		mockMvc.perform(slotRequest(hospitalId, future(-1), future(-1).plusMinutes(30)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void 겹치는_슬롯은_409이고_경계가_맞닿는_슬롯은_허용된다() throws Exception {
		LocalDateTime start = future(24);
		createSlot(hospitalId, start, start.plusMinutes(30));

		mockMvc.perform(slotRequest(hospitalId, start.plusMinutes(15), start.plusMinutes(45)))
				.andExpect(status().isConflict());
		mockMvc.perform(slotRequest(hospitalId, start.plusMinutes(30), start.plusMinutes(60)))
				.andExpect(status().isCreated());
	}

	@Test
	void 지난_슬롯은_예약도_대기신청도_할_수_없다() throws Exception {
		long petId = createPet(userToken, "지난슬롯펫");
		Slot pastSlot = savePastSlot();

		mockMvc.perform(reservationRequest(userToken, petId, pastSlot.getId()))
				.andExpect(status().isConflict());

		pastSlot.reserve();
		slotRepository.save(pastSlot);
		mockMvc.perform(post("/api/waitlists")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"petId\":" + petId + ",\"slotId\":" + pastSlot.getId() + "}"))
				.andExpect(status().isConflict());
	}

	@Test
	void 지난_예약은_취소할_수_없고_노쇼는_시간이_지난_뒤에만_가능하다() throws Exception {
		long petId = createPet(userToken, "노쇼펫");

		long pastReservationId = savePastConfirmedReservation(petId);
		mockMvc.perform(patch("/api/reservations/" + pastReservationId + "/cancel")
						.header("Authorization", "Bearer " + userToken))
				.andExpect(status().isConflict());
		mockMvc.perform(patch("/api/admin/reservations/" + pastReservationId + "/no-show")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());

		LocalDateTime start = future(48);
		long futureReservationId = createReservation(userToken, petId, createSlot(hospitalId, start, start.plusMinutes(30)));
		mockMvc.perform(patch("/api/admin/reservations/" + futureReservationId + "/confirm")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		mockMvc.perform(patch("/api/admin/reservations/" + futureReservationId + "/no-show")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isConflict());
	}

	// ---------- 슬롯 일괄 등록 / 삭제 / 조회 ----------

	@Test
	void 일괄_등록은_겹치는_칸만_건너뛰고_조회는_지난_슬롯_없이_시간순이다() throws Exception {
		LocalDate day1 = LocalDate.now().plusDays(1);
		createSlot(hospitalId, day1.atTime(10, 0), day1.atTime(10, 30)); // 겹칠 기존 슬롯
		Slot pastSlot = savePastSlot();

		MvcResult result = mockMvc.perform(bulkRequest(day1, day1.plusDays(1), "10:00", "12:00", 30))
				.andExpect(status().isCreated())
				.andReturn();
		assertThat(data(result).get("created").asInt()).isEqualTo(7); // 2일 × 4칸 - 겹침 1
		assertThat(data(result).get("skipped").asInt()).isEqualTo(1);

		JsonNode slots = data(mockMvc.perform(get("/api/hospitals/" + hospitalId + "/slots?size=100")
						.header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk())
				.andReturn()).get("content");
		assertThat(slots).hasSize(8);
		assertThat(slots.toString()).doesNotContain("\"id\":" + pastSlot.getId() + ",");
		for (int i = 1; i < slots.size(); i++) {
			assertThat(slots.get(i).get("startTime").asText()).isGreaterThan(slots.get(i - 1).get("startTime").asText());
		}
	}

	@Test
	void 일괄_등록은_31일_또는_500개를_넘으면_400이다() throws Exception {
		LocalDate day1 = LocalDate.now().plusDays(1);
		mockMvc.perform(bulkRequest(day1, day1.plusDays(31), "10:00", "11:00", 60))
				.andExpect(status().isBadRequest());
		mockMvc.perform(bulkRequest(day1, day1.plusDays(30), "08:00", "20:00", 10))
				.andExpect(status().isBadRequest());
	}

	@Test
	void 슬롯_삭제는_예약_가능하고_예약_이력이_없는_슬롯만_된다() throws Exception {
		LocalDateTime start = future(24);
		long freeSlot = createSlot(hospitalId, start, start.plusMinutes(30));
		long reservedSlot = createSlot(hospitalId, start.plusHours(1), start.plusHours(1).plusMinutes(30));
		long cancelledSlot = createSlot(hospitalId, start.plusHours(2), start.plusHours(2).plusMinutes(30));
		long petId = createPet(userToken, "삭제펫");
		createReservation(userToken, petId, reservedSlot);
		long cancelled = createReservation(userToken, petId, cancelledSlot);
		mockMvc.perform(patch("/api/reservations/" + cancelled + "/cancel").header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk());

		mockMvc.perform(deleteSlot(freeSlot)).andExpect(status().isOk());
		mockMvc.perform(deleteSlot(reservedSlot)).andExpect(status().isConflict());
		mockMvc.perform(deleteSlot(cancelledSlot)).andExpect(status().isConflict());
		mockMvc.perform(delete("/api/hospitals/" + hospitalId + "/slots/" + freeSlot)
						.header("Authorization", "Bearer " + userToken))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("접근 권한이 없습니다.")); // @PreAuthorize 거부는 공통 문구
	}

	// ---------- 권한 ----------

	@Test
	void 병원_소유자는_자기_병원_예약만_확정할_수_있고_새_예약_알림을_받는다() throws Exception {
		String ownerEmail = "owner-rule-" + suffix + "@petcare.com";
		String ownerToken = signupAndLogin(ownerEmail);
		long ownerId = userRepository.findByEmail(ownerEmail).orElseThrow().getId();
		long ownHospitalId = createHospital();
		mockMvc.perform(patch("/api/admin/hospitals/" + ownHospitalId + "/owner")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"ownerId\":" + ownerId + "}"))
				.andExpect(status().isOk());
		ownerToken = login(ownerEmail, "password123"); // 승격된 role로 다시 로그인

		long petId = createPet(userToken, "권한펫");
		LocalDateTime start = future(24);
		long otherReservation = createReservation(userToken, petId, createSlot(hospitalId, start, start.plusMinutes(30)));
		long ownReservation = createReservation(userToken, petId, createSlot(ownHospitalId, start, start.plusMinutes(30)));

		mockMvc.perform(patch("/api/admin/reservations/" + otherReservation + "/confirm")
						.header("Authorization", "Bearer " + ownerToken))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("해당 병원의 예약을 관리할 권한이 없습니다."));
		mockMvc.perform(patch("/api/admin/reservations/" + ownReservation + "/confirm")
						.header("Authorization", "Bearer " + ownerToken))
				.andExpect(status().isOk());

		assertThat(notificationTypes(ownerToken)).contains("RESERVATION_REQUESTED");
	}

	@Test
	void 공동보호자는_조회는_되지만_반려동물을_삭제할_수_없다() throws Exception {
		String guardianEmail = "guardian-rule-" + suffix + "@petcare.com";
		String guardianToken = signupAndLogin(guardianEmail);
		long petId = createPet(userToken, "공유펫");
		mockMvc.perform(post("/api/pets/" + petId + "/guardians")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + guardianEmail + "\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/pets/" + petId).header("Authorization", "Bearer " + guardianToken))
				.andExpect(status().isOk());
		mockMvc.perform(delete("/api/pets/" + petId).header("Authorization", "Bearer " + guardianToken))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("반려동물 삭제는 최초 등록자만 할 수 있습니다."));
	}

	// ---------- 대기자 명단 ----------

	@Test
	void 예약이_취소되면_대기_1순위에게만_알림이_간다() throws Exception {
		LocalDateTime start = future(24);
		long slotId = createSlot(hospitalId, start, start.plusMinutes(30));
		long reservationId = createReservation(userToken, createPet(userToken, "예약펫"), slotId);

		String firstToken = signupAndLogin("wait1-" + suffix + "@petcare.com");
		String secondToken = signupAndLogin("wait2-" + suffix + "@petcare.com");
		joinWaitlist(firstToken, createPet(firstToken, "대기1펫"), slotId);
		joinWaitlist(secondToken, createPet(secondToken, "대기2펫"), slotId);

		mockMvc.perform(patch("/api/reservations/" + reservationId + "/cancel")
						.header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk());

		assertThat(notificationTypes(firstToken)).contains("WAITLIST_SLOT_AVAILABLE");
		assertThat(notificationTypes(secondToken)).doesNotContain("WAITLIST_SLOT_AVAILABLE");
	}

	// ---------- 응답 필드 ----------

	@Test
	void 예약_응답에_병원명과_시간이_있고_리뷰의_mine은_작성자에게만_true다() throws Exception {
		LocalDateTime start = future(24);
		long slotId = createSlot(hospitalId, start, start.plusMinutes(30));
		long reservationId = createReservation(userToken, createPet(userToken, "응답펫"), slotId);

		MvcResult reservation = mockMvc.perform(get("/api/reservations/" + reservationId)
						.header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk())
				.andReturn();
		assertThat(data(reservation).get("hospitalName").asText()).isEqualTo("규칙테스트병원");
		assertThat(LocalDateTime.parse(data(reservation).get("startTime").asText())).isEqualTo(start);

		mockMvc.perform(patch("/api/admin/reservations/" + reservationId + "/confirm")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/hospitals/" + hospitalId + "/reviews")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"rating\":5,\"content\":\"좋아요\"}"))
				.andExpect(status().isCreated());

		String otherToken = signupAndLogin("reviewer-other-" + suffix + "@petcare.com");
		assertThat(firstReviewMine(userToken)).isTrue();
		assertThat(firstReviewMine(otherToken)).isFalse();
	}

	// ---------- 리마인더 ----------

	@Test
	void 리마인더는_여러_번_실행해도_한_번만_가고_접종_예정일을_바꾸면_다시_간다() throws Exception {
		long petId = createPet(userToken, "리마인더펫");
		LocalDateTime start = LocalDate.now().plusDays(1).atTime(10, 0);
		long reservationId = createReservation(userToken, petId, createSlot(hospitalId, start, start.plusMinutes(30)));
		mockMvc.perform(patch("/api/admin/reservations/" + reservationId + "/confirm")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		MvcResult record = mockMvc.perform(post("/api/pets/" + petId + "/health-records")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content(healthRecordJson(LocalDate.now().plusDays(2))))
				.andExpect(status().isCreated())
				.andReturn();
		long recordId = data(record).get("id").asLong();

		runReminders();
		runReminders();
		String notifications = notificationTypes(userToken);
		assertThat(countOf(notifications, "RESERVATION_REMINDER")).isEqualTo(1);
		assertThat(countOf(notifications, "VACCINATION_DUE_SOON")).isEqualTo(1);
		assertThat(notifications).contains("2일 남았습니다");

		mockMvc.perform(patch("/api/pets/" + petId + "/health-records/" + recordId)
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content(healthRecordJson(LocalDate.now().plusDays(1))))
				.andExpect(status().isOk());
		runReminders();
		notifications = notificationTypes(userToken);
		assertThat(countOf(notifications, "VACCINATION_DUE_SOON")).isEqualTo(2);
		assertThat(notifications).contains("1일 남았습니다");
	}

	// ---------- 계정 정지 ----------

	@Test
	void 정지되면_기존_토큰은_401이고_재발급은_403이다() throws Exception {
		String email = "suspend-rule-" + suffix + "@petcare.com";
		signup(email);
		JsonNode tokens = loginResponse(email, "password123");
		String accessToken = tokens.get("accessToken").asText();
		String refreshToken = tokens.get("refreshToken").asText();
		long userId = userRepository.findByEmail(email).orElseThrow().getId();

		mockMvc.perform(patch("/api/admin/users/" + userId + "/suspend").header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/auth/reissue")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"refreshToken\":\"" + refreshToken + "\"}"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("정지된 계정입니다. 관리자에게 문의해주세요."));
	}

	// ---------- helpers ----------

	private LocalDateTime future(int hours) {
		return LocalDateTime.now().plusHours(hours).truncatedTo(ChronoUnit.MINUTES);
	}

	private Slot savePastSlot() {
		LocalDateTime start = future(-2);
		return slotRepository.save(Slot.builder()
				.hospital(hospitalRepository.findById(hospitalId).orElseThrow())
				.startTime(start)
				.endTime(start.plusMinutes(30))
				.build());
	}

	private long savePastConfirmedReservation(long petId) {
		Slot slot = savePastSlot();
		slot.reserve();
		slotRepository.save(slot);
		return reservationRepository.save(Reservation.builder()
				.slot(slot)
				.pet(petRepository.findById(petId).orElseThrow())
				.user(userRepository.findByEmail(userEmail).orElseThrow())
				.status(ReservationStatus.CONFIRMED)
				.type(ReservationType.CHECKUP)
				.build()).getId();
	}

	private String signupAndLogin(String email) throws Exception {
		signup(email);
		return login(email, "password123");
	}

	private void signup(String email) throws Exception {
		mockMvc.perform(post("/api/auth/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
				.andExpect(status().isCreated());
	}

	private String login(String email, String password) throws Exception {
		return loginResponse(email, password).get("accessToken").asText();
	}

	private JsonNode loginResponse(String email, String password) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
				.andExpect(status().isOk())
				.andReturn();
		return data(result);
	}

	private long createHospital() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/hospitals")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"규칙테스트병원\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		return data(result).get("id").asLong();
	}

	private long createPet(String token, String name) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/pets")
						.header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"" + name + "\",\"species\":\"DOG\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		return data(result).get("id").asLong();
	}

	private MockHttpServletRequestBuilder slotRequest(long hospitalId, LocalDateTime start, LocalDateTime end) {
		return post("/api/hospitals/" + hospitalId + "/slots")
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"startTime\":\"" + start + "\",\"endTime\":\"" + end + "\"}");
	}

	private MockHttpServletRequestBuilder bulkRequest(
			LocalDate startDate, LocalDate endDate, String startTime, String endTime, int interval) {
		return post("/api/hospitals/" + hospitalId + "/slots/bulk")
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"startDate\":\"" + startDate + "\",\"endDate\":\"" + endDate + "\","
						+ "\"daysOfWeek\":[\"MONDAY\",\"TUESDAY\",\"WEDNESDAY\",\"THURSDAY\",\"FRIDAY\",\"SATURDAY\",\"SUNDAY\"],"
						+ "\"startTime\":\"" + startTime + "\",\"endTime\":\"" + endTime + "\",\"intervalMinutes\":" + interval + "}");
	}

	private MockHttpServletRequestBuilder deleteSlot(long slotId) {
		return delete("/api/hospitals/" + hospitalId + "/slots/" + slotId).header("Authorization", "Bearer " + adminToken);
	}

	private long createSlot(long hospitalId, LocalDateTime start, LocalDateTime end) throws Exception {
		MvcResult result = mockMvc.perform(slotRequest(hospitalId, start, end))
				.andExpect(status().isCreated())
				.andReturn();
		return data(result).get("id").asLong();
	}

	private MockHttpServletRequestBuilder reservationRequest(String token, long petId, long slotId) {
		return post("/api/reservations")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"petId\":" + petId + ",\"slotId\":" + slotId + ",\"type\":\"CHECKUP\"}");
	}

	private long createReservation(String token, long petId, long slotId) throws Exception {
		MvcResult result = mockMvc.perform(reservationRequest(token, petId, slotId))
				.andExpect(status().isCreated())
				.andReturn();
		return data(result).get("id").asLong();
	}

	private void joinWaitlist(String token, long petId, long slotId) throws Exception {
		mockMvc.perform(post("/api/waitlists")
						.header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"petId\":" + petId + ",\"slotId\":" + slotId + "}"))
				.andExpect(status().isCreated());
	}

	private String notificationTypes(String token) throws Exception {
		MvcResult result = mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andReturn();
		return data(result).get("content").toString();
	}

	private boolean firstReviewMine(String token) throws Exception {
		MvcResult result = mockMvc.perform(get("/api/hospitals/" + hospitalId + "/reviews")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andReturn();
		return data(result).get("content").get(0).get("mine").asBoolean();
	}

	private void runReminders() throws Exception {
		mockMvc.perform(post("/api/admin/reminders/run").header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
	}

	private String healthRecordJson(LocalDate nextDueDate) {
		return "{\"type\":\"VACCINATION\",\"recordedAt\":\"" + LocalDate.now() + "\",\"content\":\"종합백신\","
				+ "\"nextDueDate\":\"" + nextDueDate + "\"}";
	}

	private int countOf(String text, String token) {
		return text.split(token, -1).length - 1;
	}

	private JsonNode data(MvcResult result) throws Exception {
		return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
	}
}
