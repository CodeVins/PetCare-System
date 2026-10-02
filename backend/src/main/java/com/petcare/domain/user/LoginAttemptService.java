package com.petcare.domain.user;

import com.petcare.global.exception.TooManyRequestsException;
import java.time.Duration;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * 로그인 실패 횟수 제한 (무차별 대입 방지). 이메일별 실패 횟수를 Redis에 TTL로 저장.
 * Redis 장애 시엔 제한 없이 통과(fail-open) — 부가 보호 기능 때문에 로그인 전체가 막히면 안 됨.
 * ponytail: 키가 이메일만이라 공격자가 남의 이메일로 실패를 쌓으면 그 유저가 15분간 잠김 — 악용되면 IP를 키에 추가
 */
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

	private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

	static final int MAX_FAILURES = 5;
	static final Duration LOCK_DURATION = Duration.ofMinutes(15);

	private final StringRedisTemplate redisTemplate;

	public void checkBlocked(String email) {
		try {
			String count = redisTemplate.opsForValue().get(key(email));
			if (count != null && Integer.parseInt(count) >= MAX_FAILURES) {
				throw new TooManyRequestsException("로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.");
			}
		} catch (DataAccessException e) {
			log.warn("Redis 조회 실패, 로그인 시도 제한 생략: {}", e.getMessage());
		}
	}

	public void recordFailure(String email) {
		try {
			String key = key(email);
			redisTemplate.opsForValue().increment(key);
			// 실패할 때마다 TTL을 다시 걸어서 "마지막 실패 후 15분" 동안 유지 — INCR와 EXPIRE 사이에 죽어도 다음 실패 때 TTL이 생김
			redisTemplate.expire(key, LOCK_DURATION);
		} catch (DataAccessException e) {
			log.warn("Redis 기록 실패, 로그인 실패 횟수 미반영: {}", e.getMessage());
		}
	}

	public void reset(String email) {
		try {
			redisTemplate.delete(key(email));
		} catch (DataAccessException e) {
			log.warn("Redis 삭제 실패: {}", e.getMessage());
		}
	}

	// MySQL 이메일 비교는 대소문자 무시라서, 키도 소문자로 맞춰야 대소문자만 바꿔 제한을 우회하는 걸 막음
	private String key(String email) {
		return "login:fail:" + email.toLowerCase(Locale.ROOT);
	}
}
