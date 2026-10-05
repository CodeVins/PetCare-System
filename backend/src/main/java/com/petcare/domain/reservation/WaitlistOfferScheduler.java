package com.petcare.domain.reservation;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 대기자 차례 넘기기 — 1분마다 차례 시간(OFFER_MINUTES)이 지난 항목을 다음 사람에게 넘김.
 * 만료 시각을 DB(Waitlist.offeredAt)에 두고 주기적으로 확인하는 방식이라, 서버가 잠깐 꺼져 있어도 다음 실행 때 따라잡음
 * (Redis 키 만료 이벤트는 그 순간 앱이 없으면 영영 유실돼서 쓰지 않음).
 * ponytail: 서버 1대 기준 — 여러 대로 늘리면 같은 항목을 동시에 처리하지 않게 ShedLock 등 분산 락 필요
 */
@Component
@RequiredArgsConstructor
public class WaitlistOfferScheduler {

	private static final Logger log = LoggerFactory.getLogger(WaitlistOfferScheduler.class);

	private final WaitlistService waitlistService;

	@Scheduled(fixedRate = 60_000)
	public void handOffExpiredOffers() {
		int handled = waitlistService.handOffExpiredOffers();
		if (handled > 0) {
			log.info("대기자 차례 만료 {}건 처리", handled);
		}
	}
}
