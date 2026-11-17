package com.petcare.domain.pet;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetRoutineRepository extends JpaRepository<PetRoutine, Long> {

	List<PetRoutine> findAllByPetId(Long petId);

	// 캘린더용 — 기간과 겹치는 루틴(내 펫 + 공동보호자 펫). 실제로 그날 있는지는 PetRoutine.occursOn으로 다시 거름
	@Query("select r from PetRoutine r join fetch r.pet p"
			+ " where r.startDate <= :to and (r.endDate is null or r.endDate >= :from)"
			+ " and (:petId is null or p.id = :petId)"
			+ " and (p.user.id = :userId or exists (select 1 from PetGuardian g where g.pet = p and g.user.id = :userId))")
	List<PetRoutine> findAllAccessibleOverlapping(
			@Param("userId") Long userId, @Param("petId") Long petId,
			@Param("from") LocalDate from, @Param("to") LocalDate to);

	// 루틴 알림 대상 — 시각이 [from, now] 사이이고 오늘 기간 안이며 오늘 아직 안 보낸 것. 요일·완료 여부는 서비스에서 다시 거름
	@Query("select r from PetRoutine r join fetch r.pet"
			+ " where r.time is not null and r.time >= :from and r.time <= :now"
			+ " and r.startDate <= :today and (r.endDate is null or r.endDate >= :today)"
			+ " and (r.remindedDate is null or r.remindedDate < :today)")
	List<PetRoutine> findUnremindedDueBetween(
			@Param("today") LocalDate today, @Param("from") LocalTime from, @Param("now") LocalTime now);

	void deleteAllByPetId(Long petId);
}
