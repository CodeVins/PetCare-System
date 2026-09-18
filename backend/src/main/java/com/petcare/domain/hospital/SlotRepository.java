package com.petcare.domain.hospital;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlotRepository extends JpaRepository<Slot, Long> {

	Page<Slot> findAllByHospitalId(Long hospitalId, Pageable pageable);

	Page<Slot> findAllByHospitalIdAndStatus(Long hospitalId, SlotStatus status, Pageable pageable);
}
