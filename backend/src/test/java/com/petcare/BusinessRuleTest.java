package com.petcare;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import com.petcare.domain.reservation.WaitlistRepository;
import com.petcare.domain.reservation.WaitlistService;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
@Import(RedisTestConfig.class)
class BusinessRuleTest {

	@Autowired private MockMvc mockMvc;
	@Autowired private ObjectMapper objectMapper;
	@Autowired private UserRepository userRepository;
	@Autowired private PasswordEncoder passwordEncoder;
	@Autowired private HospitalRepository hospitalRepository;
	@Autowired private SlotRepository slotRepository;
	@Autowired private PetRepository petRepository;
	@Autowired private ReservationRepository reservationRepository;
	@Autowired private WaitlistRepository waitlistRepository;
	@Autowired private WaitlistService waitlistService;

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

	@Test
	void 대기_차례를_받고_시간_안에_예약하지_않으면_다음_사람에게_넘어가고_누가_예약하면_멈춘다() throws Exception {
		LocalDateTime start = future(24);
		long slotId = createSlot(hospitalId, start, start.plusMinutes(30));
		long reservationId = createReservation(userToken, createPet(userToken, "차례펫"), slotId);
		String firstToken = signupAndLogin("turn1-" + suffix + "@petcare.com");
		String secondToken = signupAndLogin("turn2-" + suffix + "@petcare.com");
		String thirdToken = signupAndLogin("turn3-" + suffix + "@petcare.com");
		joinWaitlist(firstToken, createPet(firstToken, "차례1펫"), slotId);
		joinWaitlist(secondToken, createPet(secondToken, "차례2펫"), slotId);
		joinWaitlist(thirdToken, createPet(thirdToken, "차례3펫"), slotId);

		mockMvc.perform(patch("/api/reservations/" + reservationId + "/cancel")
						.header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk());
		assertThat(getData("/api/waitlists", firstToken).get("content").get(0).get("offerExpiresAt").isNull()).isFalse();
		assertThat(getData("/api/waitlists", secondToken).get("content").get(0).get("offerExpiresAt").isNull()).isTrue();

		// 1순위의 차례 시간이 지남 → 2순위에게 넘어가고 1순위 항목은 정리
		expireOffers(slotId);
		waitlistService.handOffExpiredOffers();
		assertThat(getData("/api/waitlists", firstToken).get("content")).isEmpty();
		assertThat(notificationTypes(secondToken)).contains("WAITLIST_SLOT_AVAILABLE");
		assertThat(notificationTypes(thirdToken)).doesNotContain("WAITLIST_SLOT_AVAILABLE");

		// 차례 중에 다른 사람이 예약하면 제안 종료 — 시간이 지나도 3순위에게 안 넘어가고 3순위는 계속 대기
		createReservation(userToken, createPet(userToken, "새치기펫"), slotId);
		assertThat(getData("/api/waitlists", secondToken).get("content")).isEmpty();
		expireOffers(slotId);
		waitlistService.handOffExpiredOffers();
		assertThat(notificationTypes(thirdToken)).doesNotContain("WAITLIST_SLOT_AVAILABLE");
		assertThat(getData("/api/waitlists", thirdToken).get("content")).hasSize(1);
	}

	// 스케줄러를 기다리지 않고 차례 시간을 지난 것으로 만듦
	private void expireOffers(long slotId) {
		waitlistRepository.findAll().stream()
				.filter(w -> w.getSlot().getId().equals(slotId) && w.getOfferedAt() != null)
				.forEach(w -> {
					w.markOffered(LocalDateTime.now().minusMinutes(WaitlistService.OFFER_MINUTES + 1));
					waitlistRepository.save(w);
				});
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

	@Test
	void 소유자는_자기_병원과_그_리뷰_신고만_보고_필터는_작성자_신고자_날짜로_걸린다() throws Exception {
		String ownerEmail = "owner-review-" + suffix + "@petcare.com";
		signup(ownerEmail);
		long ownerId = userRepository.findByEmail(ownerEmail).orElseThrow().getId();
		long ownHospitalId = createHospital();
		mockMvc.perform(patch("/api/admin/hospitals/" + ownHospitalId + "/owner")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"ownerId\":" + ownerId + "}"))
				.andExpect(status().isOk());
		String ownerToken = login(ownerEmail, "password123");

		long petId = createPet(userToken, "리뷰펫");
		for (long hid : new long[] {hospitalId, ownHospitalId}) {
			LocalDateTime start = future(24);
			long reservationId = createReservation(userToken, petId, createSlot(hid, start, start.plusMinutes(30)));
			mockMvc.perform(patch("/api/admin/reservations/" + reservationId + "/confirm")
							.header("Authorization", "Bearer " + adminToken))
					.andExpect(status().isOk());
			mockMvc.perform(post("/api/hospitals/" + hid + "/reviews")
							.header("Authorization", "Bearer " + userToken)
							.contentType(MediaType.APPLICATION_JSON)
							.content("{\"rating\":4,\"content\":\"리뷰 " + hid + "\"}"))
					.andExpect(status().isCreated());
		}

		JsonNode owned = getData("/api/users/me/hospitals", ownerToken);
		assertThat(owned.size()).isEqualTo(1);
		assertThat(owned.get(0).get("id").asLong()).isEqualTo(ownHospitalId);

		JsonNode mine = getData("/api/users/me/reviews", userToken);
		assertThat(mine.get("totalElements").asInt()).isEqualTo(2);
		assertThat(mine.get("content").get(0).get("hospitalName").asText()).isEqualTo("규칙테스트병원");

		// 소유자는 author 필터 없이도 본인 병원 리뷰만, 관리자는 작성자로 걸러서 둘 다
		JsonNode ownerReviews = getData("/api/admin/reviews", ownerToken);
		assertThat(ownerReviews.get("totalElements").asInt()).isEqualTo(1);
		assertThat(ownerReviews.get("content").get(0).get("authorEmail").asText()).isEqualTo(userEmail);
		assertThat(getData("/api/admin/reviews?author=" + userEmail, adminToken).get("totalElements").asInt()).isEqualTo(2);
		assertThat(getData("/api/admin/reviews?author=" + userEmail + "&from=" + LocalDate.now().plusDays(1), adminToken)
				.get("totalElements").asInt()).isZero();

		String reporterEmail = "reporter-" + suffix + "@petcare.com";
		String reporterToken = signupAndLogin(reporterEmail);
		for (long hid : new long[] {hospitalId, ownHospitalId}) {
			long reviewId = getData("/api/admin/reviews?author=" + userEmail + "&hospitalId=" + hid, adminToken)
					.get("content").get(0).get("id").asLong();
			mockMvc.perform(post("/api/hospitals/" + hid + "/reviews/" + reviewId + "/report")
							.header("Authorization", "Bearer " + reporterToken)
							.contentType(MediaType.APPLICATION_JSON)
							.content("{\"reason\":\"욕설\"}"))
					.andExpect(status().isOk());
		}

		JsonNode ownerReports = getData("/api/admin/reviews/reports", ownerToken);
		assertThat(ownerReports.get("totalElements").asInt()).isEqualTo(1);
		assertThat(ownerReports.get("content").get(0).get("reporterEmail").asText()).isEqualTo(reporterEmail);
		assertThat(ownerReports.get("content").get(0).get("reviewAuthorEmail").asText()).isEqualTo(userEmail);
		assertThat(getData("/api/admin/reviews/reports?reporter=" + reporterEmail, adminToken)
				.get("totalElements").asInt()).isEqualTo(2);
		assertThat(getData("/api/admin/reviews/reports?reporter=" + reporterEmail + "&to=" + LocalDate.now().minusDays(1),
				adminToken).get("totalElements").asInt()).isZero();
		assertThat(getData("/api/admin/reviews?author=" + userEmail, adminToken)
				.get("content").get(0).get("reportCount").asInt()).isEqualTo(1);
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

	@Test
	void 공동보호자도_접종_리마인더를_한_번_받고_D_day_목록에서_볼_수_있다() throws Exception {
		String guardianEmail = "guardian-remind-" + suffix + "@petcare.com";
		String guardianToken = signupAndLogin(guardianEmail);
		long petId = createPet(userToken, "공유리마인더펫");
		mockMvc.perform(post("/api/pets/" + petId + "/guardians")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + guardianEmail + "\"}"))
				.andExpect(status().isCreated());
		mockMvc.perform(post("/api/pets/" + petId + "/health-records")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content(healthRecordJson(LocalDate.now().plusDays(3))))
				.andExpect(status().isCreated());

		runReminders();
		runReminders();
		assertThat(countOf(notificationTypes(guardianToken), "VACCINATION_DUE_SOON")).isEqualTo(1);
		assertThat(countOf(notificationTypes(userToken), "VACCINATION_DUE_SOON")).isEqualTo(1);

		MvcResult upcoming = mockMvc.perform(get("/api/users/me/upcoming-vaccinations")
						.header("Authorization", "Bearer " + guardianToken))
				.andExpect(status().isOk())
				.andReturn();
		assertThat(data(upcoming).toString()).contains("공유리마인더펫");
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

	// ---------- 진료 기록 ----------

	@Test
	void 병원은_지난_확정_예약에만_진료_기록을_남기고_보호자는_수정할_수_없다() throws Exception {
		long petId = createPet(userToken, "진료펫");
		LocalDateTime start = future(24);
		long futureReservation = createReservation(userToken, petId, createSlot(hospitalId, start, start.plusMinutes(30)));
		mockMvc.perform(patch("/api/admin/reservations/" + futureReservation + "/confirm")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		mockMvc.perform(treatmentRequest(futureReservation, "TREATMENT", "피부염 진료", null))
				.andExpect(status().isConflict()); // 진료 시간 전

		long pastReservation = savePastConfirmedReservation(petId);
		mockMvc.perform(treatmentRequest(pastReservation, "WEIGHT", "체중", null))
				.andExpect(status().isBadRequest()); // 진료/접종만
		String nextVisit = LocalDate.now().plusDays(14).toString();
		mockMvc.perform(treatmentRequest(pastReservation, "TREATMENT", "피부염 진료, 연고 처방", nextVisit))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.hospitalName").value("규칙테스트병원"));
		// 다시 저장하면 새로 만들지 않고 수정
		mockMvc.perform(treatmentRequest(pastReservation, "TREATMENT", "피부염 진료, 연고·약 처방", nextVisit))
				.andExpect(status().isOk());

		JsonNode records = getData("/api/pets/" + petId + "/health-records", userToken).get("content");
		assertThat(records).hasSize(1);
		JsonNode record = records.get(0);
		assertThat(record.get("content").asText()).isEqualTo("피부염 진료, 연고·약 처방");
		assertThat(record.get("nextDueDate").asText()).isEqualTo(nextVisit);
		assertThat(countOf(notificationTypes(userToken), "TREATMENT_RECORDED")).isEqualTo(1); // 생성 때만

		String recordUrl = "/api/pets/" + petId + "/health-records/" + record.get("id").asLong();
		mockMvc.perform(patch(recordUrl).header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"type\":\"TREATMENT\",\"recordedAt\":\"" + LocalDate.now() + "\",\"content\":\"고침\"}"))
				.andExpect(status().isForbidden());
		mockMvc.perform(delete(recordUrl).header("Authorization", "Bearer " + userToken))
				.andExpect(status().isForbidden());
	}

	private MockHttpServletRequestBuilder treatmentRequest(long reservationId, String type, String content, String nextDueDate) {
		return put("/api/admin/reservations/" + reservationId + "/treatment")
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"type\":\"" + type + "\",\"content\":\"" + content + "\""
						+ (nextDueDate == null ? "" : ",\"nextDueDate\":\"" + nextDueDate + "\"") + "}");
	}

	// ---------- 예약에 자가 문진 첨부 ----------

	@Test
	void 예약에_최근_자가_문진과_메모를_첨부하면_병원이_예약_목록에서_본다() throws Exception {
		long petId = createPet(userToken, "문진펫");
		long otherPetId = createPet(userToken, "다른펫");
		long recordId = submitHealthCheck(petId);
		long otherPetRecordId = submitHealthCheck(otherPetId);
		long oldRecordId = data(mockMvc.perform(post("/api/pets/" + petId + "/health-records")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"type\":\"HEALTH_CHECK\",\"recordedAt\":\"" + LocalDate.now().minusDays(20)
								+ "\",\"content\":\"예전 문진\"}"))
				.andExpect(status().isCreated())
				.andReturn()).get("id").asLong();

		LocalDateTime start = future(24);
		long slotId = createSlot(hospitalId, start, start.plusMinutes(30));
		// 다른 펫의 문진, 오래된 문진은 400 — 그리고 슬롯이 묶이지 않아야 함(바로 다음 요청이 성공)
		mockMvc.perform(reservationWithAttachment(petId, slotId, otherPetRecordId, "메모"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(reservationWithAttachment(petId, slotId, oldRecordId, "메모"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(reservationWithAttachment(petId, slotId, recordId, "어제부터 귀를 긁어요"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.memo").value("어제부터 귀를 긁어요"))
				.andExpect(jsonPath("$.data.healthCheckDate").value(LocalDate.now().toString()));

		JsonNode reservation = getData("/api/admin/reservations?status=PENDING&size=100", adminToken).get("content")
				.findParents("slotId").stream()
				.filter(r -> r.get("slotId").asLong() == slotId)
				.findFirst().orElseThrow();
		assertThat(reservation.get("memo").asText()).isEqualTo("어제부터 귀를 긁어요");
		assertThat(reservation.get("healthCheckSummary").asText())
				.contains("식욕: 약간 줄었다").contains("구토: 1~2회").doesNotContain("배변");
	}

	private long submitHealthCheck(long petId) throws Exception {
		return data(mockMvc.perform(post("/api/health-check/submit")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"petId\":" + petId + ",\"saveRecord\":true,\"answers\":["
								+ "{\"questionId\":\"appetite\",\"optionId\":\"reduced\"},"
								+ "{\"questionId\":\"stool\",\"optionId\":\"normal\"},"
								+ "{\"questionId\":\"vomit\",\"optionId\":\"once\"}]}"))
				.andExpect(status().isOk())
				.andReturn()).get("savedHealthRecordId").asLong();
	}

	private MockHttpServletRequestBuilder reservationWithAttachment(long petId, long slotId, long recordId, String memo) {
		return post("/api/reservations")
				.header("Authorization", "Bearer " + userToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"petId\":" + petId + ",\"slotId\":" + slotId + ",\"type\":\"CHECKUP\",\"memo\":\"" + memo
						+ "\",\"healthCheckRecordId\":" + recordId + "}");
	}

	// ---------- 예약 시간 변경 ----------

	@Test
	void 예약_시간을_같은_병원_다른_시간으로_바꾸면_다시_확정_대기가_되고_원래_자리가_열린다() throws Exception {
		long petId = createPet(userToken, "변경펫");
		LocalDateTime start = future(48);
		long oldSlotId = createSlot(hospitalId, start, start.plusMinutes(30));
		long newSlotId = createSlot(hospitalId, start.plusHours(1), start.plusHours(1).plusMinutes(30));
		long takenSlotId = createSlot(hospitalId, start.plusHours(2), start.plusHours(2).plusMinutes(30));
		long otherHospitalSlot = createSlot(createHospital(), start, start.plusMinutes(30));
		long reservationId = createReservation(userToken, petId, oldSlotId);
		mockMvc.perform(patch("/api/admin/reservations/" + reservationId + "/confirm")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());

		String otherToken = signupAndLogin("other-resch-" + suffix + "@petcare.com");
		createReservation(otherToken, createPet(otherToken, "남의펫"), takenSlotId);

		mockMvc.perform(rescheduleRequest(userToken, reservationId, oldSlotId)).andExpect(status().isBadRequest());
		mockMvc.perform(rescheduleRequest(userToken, reservationId, otherHospitalSlot)).andExpect(status().isBadRequest());
		mockMvc.perform(rescheduleRequest(userToken, reservationId, takenSlotId)).andExpect(status().isConflict());
		mockMvc.perform(rescheduleRequest(otherToken, reservationId, newSlotId)).andExpect(status().isForbidden());

		mockMvc.perform(rescheduleRequest(userToken, reservationId, newSlotId))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.slotId").value(newSlotId))
				.andExpect(jsonPath("$.data.status").value("PENDING")); // 병원이 새 시간을 다시 확정해야 함

		// 원래 자리는 다시 열려서 다른 사람이 예약 가능
		createReservation(otherToken, createPet(otherToken, "남의펫2"), oldSlotId);
	}

	// ---------- 내 예약 목록 ----------

	@Test
	void 내_예약은_반려동물과_보기로_거르고_끝난_예약만_목록에서_지울_수_있다() throws Exception {
		long petId = createPet(userToken, "목록펫");
		long otherPetId = createPet(userToken, "다른펫");
		LocalDateTime start = future(72);
		long upcomingId = createReservation(userToken, petId, createSlot(hospitalId, start, start.plusMinutes(30)));
		long cancelledId = createReservation(userToken, petId,
				createSlot(hospitalId, start.plusHours(1), start.plusHours(1).plusMinutes(30)));
		mockMvc.perform(patch("/api/reservations/" + cancelledId + "/cancel").header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk());
		long pastId = savePastConfirmedReservation(petId);
		createReservation(userToken, otherPetId, createSlot(hospitalId, start.plusHours(2), start.plusHours(2).plusMinutes(30)));

		JsonNode counts = getData("/api/reservations/counts?petId=" + petId, userToken);
		assertThat(counts.get("ALL").asLong()).isEqualTo(3);
		assertThat(counts.get("UPCOMING").asLong()).isEqualTo(1);
		assertThat(counts.get("PAST").asLong()).isEqualTo(1);
		assertThat(counts.get("CANCELLED").asLong()).isEqualTo(1);
		assertThat(getData("/api/reservations/counts", userToken).get("ALL").asLong()).isEqualTo(4);
		assertThat(myReservationIds(petId, "UPCOMING")).containsExactly(upcomingId);
		assertThat(myReservationIds(petId, "PAST")).containsExactly(pastId);
		assertThat(myReservationIds(petId, "CANCELLED")).containsExactly(cancelledId);

		// 진행 중인 예약은 먼저 취소해야 하고, 남의 예약은 못 지움
		mockMvc.perform(delete("/api/reservations/" + upcomingId).header("Authorization", "Bearer " + userToken))
				.andExpect(status().isConflict());
		String otherToken = signupAndLogin("other-hide-" + suffix + "@petcare.com");
		mockMvc.perform(delete("/api/reservations/" + pastId).header("Authorization", "Bearer " + otherToken))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/reservations/" + pastId).header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk());
		mockMvc.perform(delete("/api/reservations/cancelled").header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data").value(1));
		assertThat(myReservationIds(petId, "ALL")).containsExactly(upcomingId);

		// 목록에서만 사라지고 기록은 그대로(병원 관리·통계·리뷰 자격용)
		assertThat(reservationRepository.findById(pastId)).isPresent();
		assertThat(reservationRepository.findById(cancelledId)).isPresent();
	}

	private List<Long> myReservationIds(long petId, String view) throws Exception {
		List<Long> ids = new ArrayList<>();
		getData("/api/reservations?petId=" + petId + "&view=" + view, userToken).get("content")
				.forEach(reservation -> ids.add(reservation.get("id").asLong()));
		return ids;
	}

	private MockHttpServletRequestBuilder rescheduleRequest(String token, long reservationId, long slotId) {
		return patch("/api/reservations/" + reservationId + "/reschedule")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"slotId\":" + slotId + "}");
	}

	// ---------- 리뷰 사진 ----------

	@Test
	void 리뷰_사진은_작성자만_3장까지_올리고_리뷰를_지우면_파일도_지워진다() throws Exception {
		savePastConfirmedReservation(createPet(userToken, "리뷰사진펫"));
		String reviewsUrl = "/api/hospitals/" + hospitalId + "/reviews";
		long reviewId = data(mockMvc.perform(post(reviewsUrl)
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"rating\":5,\"content\":\"사진 리뷰\"}"))
				.andExpect(status().isCreated())
				.andReturn()).get("id").asLong();
		String imagesUrl = reviewsUrl + "/" + reviewId + "/images";

		mockMvc.perform(imageUpload(imagesUrl, userToken, "text/plain")).andExpect(status().isBadRequest());
		String otherToken = signupAndLogin("other-photo-" + suffix + "@petcare.com");
		mockMvc.perform(imageUpload(imagesUrl, otherToken, "image/png")).andExpect(status().isForbidden());
		for (int i = 0; i < 3; i++) {
			mockMvc.perform(imageUpload(imagesUrl, userToken, "image/png")).andExpect(status().isOk());
		}
		mockMvc.perform(imageUpload(imagesUrl, userToken, "image/png")).andExpect(status().isConflict());

		JsonNode imageUrls = getData(reviewsUrl, userToken).get("content").get(0).get("imageUrls");
		assertThat(imageUrls).hasSize(3);
		String firstUrl = imageUrls.get(0).asText();
		mockMvc.perform(get(firstUrl)).andExpect(status().isOk()); // 공개로 서빙됨

		String firstName = firstUrl.substring(firstUrl.lastIndexOf('/') + 1);
		mockMvc.perform(delete(imagesUrl + "/" + firstName).header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.imageUrls.length()").value(2));
		mockMvc.perform(delete(imagesUrl + "/not-mine.png").header("Authorization", "Bearer " + userToken))
				.andExpect(status().isNotFound());
		assertThat(Files.exists(reviewImagePath(firstUrl))).isFalse();

		String remainingUrl = getData(reviewsUrl, userToken).get("content").get(0).get("imageUrls").get(0).asText();
		mockMvc.perform(delete(reviewsUrl + "/" + reviewId).header("Authorization", "Bearer " + userToken))
				.andExpect(status().isOk());
		assertThat(Files.exists(reviewImagePath(remainingUrl))).isFalse();
	}

	private MockHttpServletRequestBuilder imageUpload(String url, String token, String contentType) {
		return multipart(url)
				.file(new MockMultipartFile("file", "photo.png", contentType, new byte[] {1, 2, 3}))
				.header("Authorization", "Bearer " + token);
	}

	private Path reviewImagePath(String imageUrl) {
		return Path.of("build/test-uploads-reviews", imageUrl.substring(imageUrl.lastIndexOf('/') + 1));
	}

	// ---------- 병원 기간 통계 ----------

	@Test
	void 병원_기간_통계는_노쇼율과_취소율을_계산하고_본인_병원만_볼_수_있다() throws Exception {
		long petId = createPet(userToken, "통계펫");
		savePastConfirmedReservation(petId); // 내원
		long noShowId = savePastConfirmedReservation(petId);
		mockMvc.perform(patch("/api/admin/reservations/" + noShowId + "/no-show")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		reservationRepository.save(Reservation.builder() // 취소(슬롯은 다시 AVAILABLE)
				.slot(savePastSlot())
				.pet(petRepository.findById(petId).orElseThrow())
				.user(userRepository.findByEmail(userEmail).orElseThrow())
				.status(ReservationStatus.CANCELLED)
				.type(ReservationType.VACCINATION)
				.build());

		String url = "/api/admin/stats/hospitals/" + hospitalId;
		JsonNode stats = getData(url + "?days=7", adminToken);
		assertThat(stats.get("totalReservations").asLong()).isEqualTo(3);
		assertThat(stats.get("countByStatus").get("NO_SHOW").asLong()).isEqualTo(1);
		assertThat(stats.get("countByType").get("VACCINATION").asLong()).isEqualTo(1);
		assertThat(stats.get("noShowRate").asDouble()).isEqualTo(0.5); // 노쇼 1 / (내원 1 + 노쇼 1)
		assertThat(stats.get("cancelRate").asDouble()).isEqualTo(1.0 / 3);
		assertThat(stats.get("slotCount").asLong()).isEqualTo(3);
		assertThat(stats.get("reservedSlotCount").asLong()).isEqualTo(2);
		assertThat(stats.get("daily")).hasSize(7);
		long booked = 0;
		long cancelled = 0;
		for (JsonNode day : stats.get("daily")) {
			booked += day.get("booked").asLong();
			cancelled += day.get("cancelled").asLong();
		}
		assertThat(booked).isEqualTo(2);
		assertThat(cancelled).isEqualTo(1);

		mockMvc.perform(get(url + "?days=10").header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isBadRequest());
		mockMvc.perform(get(url).header("Authorization", "Bearer " + userToken))
				.andExpect(status().isForbidden()); // 일반 유저
		String ownerEmail = "owner-stats-" + suffix + "@petcare.com";
		signupAndLogin(ownerEmail);
		long ownHospitalId = createHospital();
		mockMvc.perform(patch("/api/admin/hospitals/" + ownHospitalId + "/owner")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"ownerId\":" + userRepository.findByEmail(ownerEmail).orElseThrow().getId() + "}"))
				.andExpect(status().isOk());
		String ownerToken = login(ownerEmail, "password123");
		mockMvc.perform(get(url).header("Authorization", "Bearer " + ownerToken))
				.andExpect(status().isForbidden()); // 다른 병원
		mockMvc.perform(get("/api/admin/stats/hospitals/" + ownHospitalId).header("Authorization", "Bearer " + ownerToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.totalReservations").value(0))
				.andExpect(jsonPath("$.data.noShowRate").doesNotExist()); // 분모 0이면 null
		mockMvc.perform(get("/api/admin/stats/summary").header("Authorization", "Bearer " + ownerToken))
				.andExpect(status().isForbidden()); // 전체 통계는 여전히 ADMIN 전용
	}

	// ---------- 요일별 진료 시간 ----------

	@Test
	void 진료_시간을_등록하면_지금_진료_중_필터와_상세에_반영되고_잘못된_시간은_거부된다() throws Exception {
		String tag = "영업" + suffix;
		long allDay = createNamedHospital(tag + "-종일", false);
		long otherDay = createNamedHospital(tag + "-다른요일", false);
		createNamedHospital(tag + "-미등록", false);
		long always = createNamedHospital(tag + "-24시", true);
		String today = LocalDate.now().getDayOfWeek().name();
		String notToday = LocalDate.now().getDayOfWeek().plus(1).name();

		// 상세를 먼저 조회해 캐시에 올려둔 뒤 등록 → 수정이 캐시를 지우는지도 확인
		assertThat(getData("/api/hospitals/" + allDay, userToken).get("weeklyHours")).isEmpty();
		StringBuilder everyDay = new StringBuilder();
		for (java.time.DayOfWeek day : java.time.DayOfWeek.values()) {
			everyDay.append(everyDay.isEmpty() ? "" : ",")
					.append("{\"dayOfWeek\":\"").append(day).append("\",\"openTime\":\"00:00\",\"closeTime\":\"23:59:59\"}");
		}
		mockMvc.perform(hoursRequest(allDay, everyDay.toString())).andExpect(status().isOk());
		mockMvc.perform(hoursRequest(otherDay, hour(notToday, "09:00", "18:00"))).andExpect(status().isOk());
		assertThat(getData("/api/hospitals/" + allDay, userToken).get("weeklyHours")).hasSize(7);

		JsonNode open = getData("/api/hospitals?keyword=" + tag + "&openNow=true", userToken);
		assertThat(open.findValuesAsText("id")).containsExactlyInAnyOrder(String.valueOf(allDay), String.valueOf(always));
		assertThat(getData("/api/hospitals?keyword=" + tag, userToken)).hasSize(4); // 필터 없으면 전부

		mockMvc.perform(hoursRequest(otherDay, hour(today, "18:00", "09:00"))).andExpect(status().isBadRequest());
		mockMvc.perform(hoursRequest(otherDay, hour(today, "09:00", "13:00") + "," + hour(today, "12:00", "18:00")))
				.andExpect(status().isBadRequest()); // 겹침
		mockMvc.perform(hoursRequest(otherDay, hour(today, "08:00", "09:00") + "," + hour(today, "10:00", "11:00") + ","
						+ hour(today, "12:00", "13:00") + "," + hour(today, "14:00", "15:00")))
				.andExpect(status().isBadRequest()); // 요일당 3개 초과
		mockMvc.perform(put("/api/hospitals/" + otherDay + "/opening-hours")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"hours\":[]}"))
				.andExpect(status().isForbidden()); // 일반 유저
	}

	private long createNamedHospital(String name, boolean is24Hours) throws Exception {
		return data(mockMvc.perform(post("/api/hospitals")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"" + name + "\",\"is24Hours\":" + is24Hours + "}"))
				.andExpect(status().isCreated())
				.andReturn()).get("id").asLong();
	}

	private String hour(String day, String open, String close) {
		return "{\"dayOfWeek\":\"" + day + "\",\"openTime\":\"" + open + "\",\"closeTime\":\"" + close + "\"}";
	}

	private MockHttpServletRequestBuilder hoursRequest(long hospitalId, String hoursJson) {
		return put("/api/hospitals/" + hospitalId + "/opening-hours")
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"hours\":[" + hoursJson + "]}");
	}

	// ---------- 병원 프로필(전화번호·소개·진료 동물·편의 서비스) ----------

	@Test
	void 병원_프로필을_저장하고_진료_동물과_편의_서비스로_검색할_수_있다() throws Exception {
		String tag = "프로필" + suffix;
		long catClinic = createProfileHospital(tag + "-고양이", "02-123-4567", "[\"CAT\"]", "[\"CAT_FRIENDLY\",\"GROOMING\"]");
		long allClinic = createProfileHospital(tag + "-종합", "031-1234-5678", "[\"DOG\",\"CAT\",\"EXOTIC\"]", "[\"EMERGENCY\"]");
		createProfileHospital(tag + "-정보없음", "", "[]", "[]");

		JsonNode detail = getData("/api/hospitals/" + catClinic, userToken);
		assertThat(detail.get("phone").asText()).isEqualTo("02-123-4567");
		assertThat(detail.get("description").asText()).isEqualTo("소개");
		assertThat(detail.get("amenities").toString()).isEqualTo("[\"GROOMING\",\"CAT_FRIENDLY\"]"); // 선언 순서로 정렬

		String base = "/api/hospitals?keyword=" + tag;
		assertThat(getData(base + "&animal=CAT", userToken).findValuesAsText("id"))
				.containsExactlyInAnyOrder(String.valueOf(catClinic), String.valueOf(allClinic));
		assertThat(getData(base + "&animal=EXOTIC", userToken).findValuesAsText("id"))
				.containsExactly(String.valueOf(allClinic));
		assertThat(getData(base + "&animal=CAT&amenity=GROOMING", userToken).findValuesAsText("id"))
				.containsExactly(String.valueOf(catClinic));

		// 수정은 전체 교체 — 진료 동물을 빼서 보내면 비워짐
		mockMvc.perform(patch("/api/hospitals/" + catClinic)
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"" + tag + "-고양이\",\"phone\":\"02-999-0000\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.phone").value("02-999-0000"))
				.andExpect(jsonPath("$.data.animals").isEmpty());

		mockMvc.perform(post("/api/hospitals")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"" + tag + "-잘못\",\"phone\":\"010 1234\"}"))
				.andExpect(status().isBadRequest());
	}

	private long createProfileHospital(String name, String phone, String animals, String amenities) throws Exception {
		return data(mockMvc.perform(post("/api/hospitals")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"" + name + "\",\"phone\":\"" + phone + "\",\"description\":\"소개\","
								+ "\"animals\":" + animals + ",\"amenities\":" + amenities + "}"))
				.andExpect(status().isCreated())
				.andReturn()).get("id").asLong();
	}

	// ---------- 병원 상세 캐시 ----------

	@Test
	void 병원_상세_캐시는_리뷰_작성과_숨김_해제_때_갱신된다() throws Exception {
		savePastConfirmedReservation(createPet(userToken, "캐시펫"));
		String detailUrl = "/api/hospitals/" + hospitalId;
		assertThat(getData(detailUrl, userToken).get("reviewCount").asLong()).isZero(); // 여기서 캐시됨

		MvcResult created = mockMvc.perform(post(detailUrl + "/reviews")
						.header("Authorization", "Bearer " + userToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"rating\":4,\"content\":\"친절해요\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		long reviewId = data(created).get("id").asLong();

		JsonNode detail = getData(detailUrl, userToken);
		assertThat(detail.get("reviewCount").asLong()).isEqualTo(1);
		assertThat(detail.get("averageRating").asDouble()).isEqualTo(4.0);

		mockMvc.perform(patch("/api/admin/reviews/" + reviewId + "/hide").header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		assertThat(getData(detailUrl, userToken).get("reviewCount").asLong()).isZero();

		mockMvc.perform(patch("/api/admin/reviews/" + reviewId + "/unhide").header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		assertThat(getData(detailUrl, userToken).get("reviewCount").asLong()).isEqualTo(1);
	}

	// ---------- 거리 검색 ----------

	@Test
	void 거리_검색은_반경_안의_좌표_있는_병원만_가까운_순으로_돌려준다() throws Exception {
		// 위도 60도(cos=0.5)라 경도 1도가 위도 1도의 절반 거리 — 사각형 경도 폭 계산이 틀리면 동쪽 병원이 빠짐
		double lat = 60.0, lng = 10.0, kmPerDegree = 111.32;
		long east = createHospitalAt("동쪽4.9km", lat, lng + 4.9 / (kmPerDegree * 0.5));
		long center = createHospitalAt("중심", lat, lng);
		createHospitalAt("사각형모서리6.4km", lat + 4.5 / kmPerDegree, lng + 4.5 / (kmPerDegree * 0.5));
		createHospitalAt("북쪽55km", lat + 0.5, lng);

		JsonNode results = getData("/api/hospitals?lat=" + lat + "&lng=" + lng + "&radiusKm=5", userToken);

		assertThat(results).hasSize(2);
		assertThat(results.get(0).get("id").asLong()).isEqualTo(center);
		assertThat(results.get(1).get("id").asLong()).isEqualTo(east);
		assertThat(results.get(1).get("distanceKm").asDouble()).isBetween(4.8, 5.0);
	}

	// ---------- helpers ----------

	private long createHospitalAt(String name, double latitude, double longitude) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/hospitals")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"" + name + "\",\"latitude\":" + latitude + ",\"longitude\":" + longitude + "}"))
				.andExpect(status().isCreated())
				.andReturn();
		return data(result).get("id").asLong();
	}

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

	private JsonNode getData(String url, String token) throws Exception {
		return data(mockMvc.perform(get(url).header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andReturn());
	}

	private JsonNode data(MvcResult result) throws Exception {
		return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
	}
}
