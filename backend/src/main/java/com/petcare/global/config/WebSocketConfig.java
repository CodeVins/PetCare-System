package com.petcare.global.config;

import com.petcare.domain.chat.ChatStompInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * 채팅 실시간 수신용 STOMP over WebSocket. 알림은 단방향이라 기존 SSE 그대로.
 * 엔드포인트를 /api 아래에 둬서 운영 Caddy(/api/*)·개발 Vite 프록시(/api) 설정을 그대로 탐.
 * ponytail: 인메모리 simple broker — 서버 1대 기준. 스케일아웃 시 Redis pub/sub 등으로 인스턴스 간 브로드캐스트 필요
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final ChatStompInterceptor chatStompInterceptor;

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		// 같은 오리진(운영)은 항상 허용됨. 개발 서버는 Vite 프록시가 Origin을 그대로 넘기므로 CORS와 같은 패턴 허용
		registry.addEndpoint("/api/ws").setAllowedOriginPatterns(
				"http://localhost:5173", "http://localhost:3000",
				"http://192.168.*.*:5173", "http://10.*.*.*:5173", "http://172.*.*.*:5173");
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/topic");
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(chatStompInterceptor);
	}
}
