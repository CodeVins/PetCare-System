package com.petcare.domain.pet;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {

	Page<HealthRecord> findAllByPetId(Long petId, Pageable pageable);

	// 변경(2026-09-27): 정확히 D-3 하루만 매칭하던 findAllByNextDueDate를 "오늘~D-3 범위 + 아직 안 보낸 것"으로 교체
	// (이전: 09시에 서버가 꺼져 있으면 그 알림은 영영 누락, 같은 날 여러 번 실행하면 중복 발송)
	@Query("select h from HealthRecord h where h.nextDueDate between :from and :to"
			+ " and (h.remindedDueDate is null or h.remindedDueDate <> h.nextDueDate)")
	List<HealthRecord> findUnremindedDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

	List<HealthRecord> findAllByPet_User_IdAndNextDueDateGreaterThanEqualOrderByNextDueDateAsc(
			Long userId, LocalDate from);

	List<HealthRecord> findAllByPetIdAndTypeOrderByRecordedAtAsc(Long petId, HealthRecordType type);

	long countByPetIdAndType(Long petId, HealthRecordType type);

	void deleteAllByPetId(Long petId);
}
