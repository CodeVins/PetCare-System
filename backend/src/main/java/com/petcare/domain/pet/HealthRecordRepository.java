package com.petcare.domain.pet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {

	Page<HealthRecord> findAllByPetId(Long petId, Pageable pageable);

	Optional<HealthRecord> findByReservationId(Long reservationId);

	// 변경(2026-09-27): 정확히 D-3 하루만 매칭하던 findAllByNextDueDate를 "오늘~D-3 범위 + 아직 안 보낸 것"으로 교체
	// (이전: 09시에 서버가 꺼져 있으면 그 알림은 영영 누락, 같은 날 여러 번 실행하면 중복 발송)
	@Query("select h from HealthRecord h where h.nextDueDate between :from and :to"
			+ " and (h.remindedDueDate is null or h.remindedDueDate <> h.nextDueDate)")
	List<HealthRecord> findUnremindedDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

	// 변경(2026-09-27): 최초 등록자 펫뿐 아니라 공동보호자로 등록된 펫의 예정일도 포함 (PetRepository.findAllAccessibleByUserId와
	// 같은 OR-EXISTS 패턴) (이전: findAllByPet_User_Id... — 공동보호자는 같이 관리하는 펫의 D-day가 마이페이지/홈에 안 보였음)
	@Query("select h from HealthRecord h where h.nextDueDate >= :from and (h.pet.user.id = :userId"
			+ " or exists (select 1 from PetGuardian g where g.pet = h.pet and g.user.id = :userId))"
			+ " order by h.nextDueDate asc")
	List<HealthRecord> findAllAccessibleDueFrom(@Param("userId") Long userId, @Param("from") LocalDate from);

	// 캘린더용 — 기록일 또는 다음 예정일이 기간 안인 기록(내 펫 + 공동보호자 펫, petId가 있으면 그 펫만)
	@Query("select h from HealthRecord h join fetch h.pet p"
			+ " where (h.recordedAt between :from and :to or h.nextDueDate between :from and :to)"
			+ " and (:petId is null or p.id = :petId)"
			+ " and (p.user.id = :userId or exists (select 1 from PetGuardian g where g.pet = p and g.user.id = :userId))")
	List<HealthRecord> findAllAccessibleInRange(
			@Param("userId") Long userId, @Param("petId") Long petId,
			@Param("from") LocalDate from, @Param("to") LocalDate to);

	Optional<HealthRecord> findByRoutineIdAndRecordedAt(Long routineId, LocalDate recordedAt);

	boolean existsByRoutineIdAndRecordedAt(Long routineId, LocalDate recordedAt);

	// 루틴 삭제 시 완료 기록은 일반 기록으로 남김
	@Modifying
	@Query("update HealthRecord h set h.routine = null where h.routine.id = :routineId")
	int detachRoutine(@Param("routineId") Long routineId);

	List<HealthRecord> findAllByPetIdAndTypeOrderByRecordedAtAsc(Long petId, HealthRecordType type);

	long countByPetIdAndType(Long petId, HealthRecordType type);

	void deleteAllByPetId(Long petId);
}
