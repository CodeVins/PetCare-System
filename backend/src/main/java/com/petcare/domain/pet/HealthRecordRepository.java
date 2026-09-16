package com.petcare.domain.pet;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {

	List<HealthRecord> findAllByPetId(Long petId);

	List<HealthRecord> findAllByNextDueDate(LocalDate nextDueDate);

	List<HealthRecord> findAllByPet_User_IdAndNextDueDateGreaterThanEqualOrderByNextDueDateAsc(
			Long userId, LocalDate from);
}
