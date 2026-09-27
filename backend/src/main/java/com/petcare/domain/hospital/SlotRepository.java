package com.petcare.domain.hospital;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlotRepository extends JpaRepository<Slot, Long> {

	// 변경(2026-09-27): 시작 시간이 지나지 않은 슬롯만 조회 (이전: findAllByHospitalId[AndStatus] — 지난 슬롯까지 섞여서
	// 일괄 등록으로 슬롯이 많아지면 프론트가 받는 첫 페이지를 지난 슬롯이 차지함)
	Page<Slot> findAllByHospitalIdAndStartTimeAfter(Long hospitalId, LocalDateTime now, Pageable pageable);

	Page<Slot> findAllByHospitalIdAndStatusAndStartTimeAfter(
			Long hospitalId, SlotStatus status, LocalDateTime now, Pageable pageable);

	// 같은 병원에 [start, end)와 겹치는 슬롯 존재 여부 — 경계가 맞닿는 건(10:00~10:30, 10:30~11:00) 겹침 아님
	boolean existsByHospitalIdAndStartTimeLessThanAndEndTimeGreaterThan(
			Long hospitalId, LocalDateTime endTime, LocalDateTime startTime);

	// 위와 같은 겹침 조건의 목록 버전 — 일괄 등록 시 기간 내 기존 슬롯을 한 번에 읽어서 메모리에서 겹침 검사
	List<Slot> findAllByHospitalIdAndStartTimeLessThanAndEndTimeGreaterThan(
			Long hospitalId, LocalDateTime endTime, LocalDateTime startTime);
}
