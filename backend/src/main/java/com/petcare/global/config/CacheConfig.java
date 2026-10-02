package com.petcare.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petcare.domain.hospital.HospitalService;
import com.petcare.domain.hospital.dto.HospitalResponse;
import java.time.Duration;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.LoggingCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

	// 무효화(@CacheEvict)가 빠진 경로가 있어도 최대 10분이면 DB 값으로 돌아오게 하는 안전망
	private static final Duration TTL = Duration.ofMinutes(10);

	// Redis 장애·역직렬화 실패 시 예외 대신 로그만 남기고 DB 조회로 진행(fail-open) — 기본 핸들러는 그대로 500을 냄
	@Override
	public CacheErrorHandler errorHandler() {
		return new LoggingCacheErrorHandler();
	}

	// JSON 저장 + Boot ObjectMapper(알 수 없는 필드 무시) — DTO 필드가 바뀌어 배포돼도 기존 캐시 읽기가 안 깨짐.
	// transactionAware: 무효화를 트랜잭션 커밋 후로 미뤄서, 커밋 전에 다른 요청이 옛 값을 다시 캐시하는 것 방지
	@Bean
	RedisCacheManagerBuilderCustomizer redisCacheCustomizer(ObjectMapper objectMapper) {
		return builder -> builder
				.transactionAware()
				.withCacheConfiguration(HospitalService.CACHE, RedisCacheConfiguration.defaultCacheConfig()
						.entryTtl(TTL)
						.serializeValuesWith(SerializationPair.fromSerializer(
								new Jackson2JsonRedisSerializer<>(objectMapper, HospitalResponse.class))));
	}
}
