package com.petcare.domain.notification;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.scheduling.annotation.Scheduled;
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

	// 알림이 한동안 없으면 프록시/로드밸런서(nginx 기본 60초 등)가 유휴 연결을 조용히 끊어서, 클라이언트는 연결된 줄
	// 알고 알림을 못 받음 — 25초마다 SSE 주석(": ping")을 보내 연결을 살려둠. 브라우저 EventSource는 주석 줄을 무시하므로
	// 프론트 변경 불필요. 전송 실패한(이미 끊긴) emitter도 여기서 정리됨
	@Scheduled(fixedRate = 25_000)
	public void sendHeartbeat() {
		emittersByUserId.forEach((userId, emitters) -> {
			for (SseEmitter emitter : emitters) {
				try {
					emitter.send(SseEmitter.event().comment("ping"));
				} catch (IOException | IllegalStateException e) {
					emitters.remove(emitter);
				}
			}
			emittersByUserId.computeIfPresent(userId, (id, list) -> list.isEmpty() ? null : list);
		});
	}
}
