package com.petcare.domain.reservation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {

	boolean existsBySlotIdAndUserId(Long slotId, Long userId);

	Page<Waitlist> findAllByUserId(Long userId, Pageable pageable);

	// 변경(2026-10-05): 아직 차례를 안 받은(offeredAt null) 사람 중 맨 앞 — 이미 알림 받은 사람은 건너뜀
	// (이전: findFirstBySlotIdOrderByCreatedAtAsc — 알림 즉시 항목을 지워서 구분이 필요 없었음)
	Optional<Waitlist> findFirstBySlotIdAndOfferedAtIsNullOrderByCreatedAtAsc(Long slotId);

	// 차례를 받은 항목(슬롯이 예약되면 정리)
	List<Waitlist> findAllBySlotIdAndOfferedAtIsNotNull(Long slotId);

	// 차례 시간이 지난 항목 — 스케줄러가 다음 사람에게 넘김. 슬롯 상태·시간을 보므로 같이 로딩
	@Query("select w from Waitlist w join fetch w.slot where w.offeredAt < :deadline")
	List<Waitlist> findAllOfferedBefore(@Param("deadline") LocalDateTime deadline);

	void deleteAllByPetId(Long petId);
}
