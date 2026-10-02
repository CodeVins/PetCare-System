package com.petcare;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import java.lang.reflect.Type;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

// 실제 포트로 띄워서 진짜 WebSocket 클라이언트로 접속 — MockMvc로는 WebSocket을 못 탐
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(RedisTestConfig.class)
class ChatWebSocketTest {

	@LocalServerPort private int port;
	@Autowired private MockMvc mockMvc;
	@Autowired private ObjectMapper objectMapper;
	@Autowired private UserRepository userRepository;
	@Autowired private PasswordEncoder passwordEncoder;
	@Autowired private SimpUserRegistry simpUserRegistry;

	private String suffix;
	private String adminToken;
	private String customerToken;
	private String ownerEmail;
	private String ownerToken;
	private long roomId;

	@BeforeEach
	void setUp() throws Exception {
		suffix = System.nanoTime() + "";
		String adminEmail = "admin-ws-" + suffix + "@petcare.com";
		userRepository.save(User.builder()
				.email(adminEmail).password(passwordEncoder.encode("adminpass123")).role(Role.ADMIN).build());
		adminToken = login(adminEmail, "adminpass123");

		long hospitalId = data(mockMvc.perform(post("/api/hospitals")
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"채팅병원\"}"))).get("id").asLong();

		ownerEmail = "owner-ws-" + suffix + "@petcare.com";
		signup(ownerEmail);
		long ownerId = userRepository.findByEmail(ownerEmail).orElseThrow().getId();
		mockMvc.perform(patch("/api/admin/hospitals/" + hospitalId + "/owner")
						.header("Authorization", "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"ownerId\":" + ownerId + "}"))
				.andExpect(status().isOk());
		ownerToken = login(ownerEmail, "password123");

		String customerEmail = "customer-ws-" + suffix + "@petcare.com";
		signup(customerEmail);
		customerToken = login(customerEmail, "password123");
		roomId = data(mockMvc.perform(post("/api/chat-rooms")
				.header("Authorization", "Bearer " + customerToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"hospitalId\":" + hospitalId + "}"))).get("id").asLong();
	}

	@Test
	void 채팅방을_보고_있으면_메시지를_바로_받고_알림은_안_쌓인다() throws Exception {
		StompSession ownerSession = connect(ownerToken, new StompSessionHandlerAdapter() {});
		BlockingQueue<Map<String, Object>> received = new LinkedBlockingQueue<>();
		ownerSession.subscribe("/topic/chat-rooms/" + roomId, new StompFrameHandler() {
			@Override
			public Type getPayloadType(StompHeaders headers) {
				return Map.class;
			}

			@Override
			@SuppressWarnings("unchecked")
			public void handleFrame(StompHeaders headers, Object payload) {
				received.add((Map<String, Object>) payload);
			}
		});
		await(() -> isSubscribed(ownerEmail));

		sendMessage("진료 가능한가요?");

		Map<String, Object> message = received.poll(5, TimeUnit.SECONDS);
		assertThat(message).isNotNull();
		assertThat(message.get("content")).isEqualTo("진료 가능한가요?");
		assertThat(chatNotificationCount()).isZero();

		// 채팅방을 나가면(연결 종료) 다시 알림으로 받음
		ownerSession.disconnect();
		await(() -> simpUserRegistry.getUser(ownerEmail) == null);
		sendMessage("답장 기다릴게요");
		assertThat(chatNotificationCount()).isEqualTo(1);
	}

	@Test
	void 다른_사람의_채팅방은_구독할_수_없다() throws Exception {
		String outsiderEmail = "outsider-ws-" + suffix + "@petcare.com";
		signup(outsiderEmail);
		BlockingQueue<StompCommand> frames = new LinkedBlockingQueue<>();
		StompSession session = connect(login(outsiderEmail, "password123"), new StompSessionHandlerAdapter() {
			@Override
			public void handleFrame(StompHeaders headers, Object payload) {
				frames.add(StompCommand.ERROR);
			}
		});

		session.subscribe("/topic/chat-rooms/" + roomId, new StompSessionHandlerAdapter() {});

		assertThat(frames.poll(5, TimeUnit.SECONDS)).isEqualTo(StompCommand.ERROR);
		await(() -> !session.isConnected());
		assertThat(isSubscribed(outsiderEmail)).isFalse();
	}

	@Test
	void 채팅_목록에_안_읽은_메시지_수가_나오고_읽으면_0이_된다() throws Exception {
		sendMessage("첫 번째");
		sendMessage("두 번째");
		assertThat(unreadCount(ownerToken)).isEqualTo(2);
		assertThat(unreadCount(customerToken)).isZero(); // 내가 보낸 메시지는 안 셈

		// 관리자 열람(중재)은 소유자의 안 읽음을 지우지 않음
		mockMvc.perform(patch("/api/chat-rooms/" + roomId + "/read").header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk());
		assertThat(unreadCount(ownerToken)).isEqualTo(2);

		mockMvc.perform(patch("/api/chat-rooms/" + roomId + "/read").header("Authorization", "Bearer " + ownerToken))
				.andExpect(status().isOk());
		assertThat(unreadCount(ownerToken)).isZero();

		sendMessage("세 번째");
		assertThat(unreadCount(ownerToken)).isEqualTo(1);
		// 헤더 배지용 전체 합계도 같은 기준
		assertThat(data(mockMvc.perform(get("/api/chat-rooms/unread-count")
				.header("Authorization", "Bearer " + ownerToken))).asLong()).isEqualTo(1);
		assertThat(data(mockMvc.perform(get("/api/chat-rooms/unread-count")
				.header("Authorization", "Bearer " + customerToken))).asLong()).isZero();
	}

	@Test
	void 토큰_없이는_연결할_수_없다() {
		assertThatThrownBy(() -> connect(null, new StompSessionHandlerAdapter() {}))
				.isInstanceOf(ExecutionException.class);
		assertThatThrownBy(() -> connect("invalid-token", new StompSessionHandlerAdapter() {}))
				.isInstanceOf(ExecutionException.class);
	}

	private StompSession connect(String token, StompSessionHandlerAdapter handler) throws Exception {
		WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
		MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
		converter.setObjectMapper(objectMapper);
		client.setMessageConverter(converter);
		StompHeaders headers = new StompHeaders();
		if (token != null) {
			headers.add("Authorization", "Bearer " + token);
		}
		return client.connectAsync("ws://localhost:" + port + "/api/ws", new WebSocketHttpHeaders(), headers, handler)
				.get(5, TimeUnit.SECONDS);
	}

	private boolean isSubscribed(String email) {
		var user = simpUserRegistry.getUser(email);
		return user != null && user.getSessions().stream()
				.anyMatch(session -> !session.getSubscriptions().isEmpty());
	}

	// 구독·연결 종료는 서버에서 비동기로 처리되므로 상태가 바뀔 때까지 짧게 대기
	private void await(BooleanSupplier condition) throws InterruptedException {
		for (int i = 0; i < 50 && !condition.getAsBoolean(); i++) {
			Thread.sleep(100);
		}
		assertThat(condition.getAsBoolean()).isTrue();
	}

	private void sendMessage(String content) throws Exception {
		mockMvc.perform(post("/api/chat-rooms/" + roomId + "/messages")
						.header("Authorization", "Bearer " + customerToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"content\":\"" + content + "\"}"))
				.andExpect(status().isCreated());
	}

	private long unreadCount(String token) throws Exception {
		JsonNode rooms = data(mockMvc.perform(get("/api/chat-rooms").header("Authorization", "Bearer " + token)))
				.get("content");
		for (JsonNode room : rooms) {
			if (room.get("id").asLong() == roomId) {
				return room.get("unreadCount").asLong();
			}
		}
		throw new AssertionError("채팅방이 목록에 없음");
	}

	private long chatNotificationCount() throws Exception {
		JsonNode content = data(mockMvc.perform(get("/api/notifications")
				.header("Authorization", "Bearer " + ownerToken))).get("content");
		long count = 0;
		for (JsonNode notification : content) {
			if ("CHAT_MESSAGE_RECEIVED".equals(notification.get("type").asText())) {
				count++;
			}
		}
		return count;
	}

	private void signup(String email) throws Exception {
		mockMvc.perform(post("/api/auth/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
				.andExpect(status().isCreated());
	}

	private String login(String email, String password) throws Exception {
		return data(mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")))
				.get("accessToken").asText();
	}

	private JsonNode data(org.springframework.test.web.servlet.ResultActions result) throws Exception {
		return objectMapper.readTree(result.andReturn().getResponse().getContentAsString()).get("data");
	}
}
