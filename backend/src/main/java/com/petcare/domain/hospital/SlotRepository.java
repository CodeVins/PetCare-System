package com.petcare.domain.hospital;

import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlotRepository extends JpaRepository<Slot, Long> {

	Page<Slot> findAllByHospitalId(Long hospitalId, Pageable pageable);

	Page<Slot> findAllByHospitalIdAndStatus(Long hospitalId, SlotStatus status, Pageable pageable);

	// 같은 병원에 [start, end)와 겹치는 슬롯 존재 여부 — 경계가 맞닿는 건(10:00~10:30, 10:30~11:00) 겹침 아님
	boolean existsByHospitalIdAndStartTimeLessThanAndEndTimeGreaterThan(
			Long hospitalId, LocalDateTime endTime, LocalDateTime startTime);
}
