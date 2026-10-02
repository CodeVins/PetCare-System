package com.petcare;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.GenericContainer;

// 테스트용 Redis 컨테이너 — @ServiceConnection이 spring.data.redis.host/port를 컨테이너 주소로 자동 연결.
// 모든 @SpringBootTest가 같은 설정으로 이걸 @Import해야 스프링 컨텍스트(=컨테이너)가 캐시돼 한 번만 뜸
@TestConfiguration(proxyBeanMethods = false)
public class RedisTestConfig {

	@Bean
	@ServiceConnection(name = "redis")
	GenericContainer<?> redisContainer() {
		return new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);
	}
}
