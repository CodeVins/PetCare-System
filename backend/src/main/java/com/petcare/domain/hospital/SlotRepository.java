package com.petcare.domain.hospital;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlotRepository extends JpaRepository<Slot, Long> {

	List<Slot> findAllByHospitalId(Long hospitalId);

	List<Slot> findAllByHospitalIdAndStatus(Long hospitalId, SlotStatus status);
}
