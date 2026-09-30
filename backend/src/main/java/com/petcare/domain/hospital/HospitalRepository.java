package com.petcare.domain.hospital;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalRepository extends JpaRepository<Hospital, Long>, HospitalRepositoryCustom {

	List<Hospital> findAllByOwnerIdOrderByNameAsc(Long ownerId);
}
