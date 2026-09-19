package com.petcare.domain.notification;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

// ponytail: 서버 인스턴스 메모리에 저장 — 서버를 여러 대로 스케일하면 다른 인스턴스에 붙은
// 클라이언트에게는 못 보냄. 필요해지면 Redis pub/sub 같은 걸로 인스턴스 간 브로드캐스트 추가.
@Component
public class SseEmitterRepository {

	private final Map<Long, List<SseEmitter>> emittersByUserId = new ConcurrentHashMap<>();

	public SseEmitter save(Long userId, SseEmitter emitter) {
		emittersByUserId.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>()).add(emitter);
		return emitter;
	}

	public void remove(Long userId, SseEmitter emitter) {
		List<SseEmitter> emitters = emittersByUserId.get(userId);
		if (emitters != null) {
			emitters.remove(emitter);
		}
	}

	public List<SseEmitter> findAllByUserId(Long userId) {
		return emittersByUserId.getOrDefault(userId, List.of());
	}
}
