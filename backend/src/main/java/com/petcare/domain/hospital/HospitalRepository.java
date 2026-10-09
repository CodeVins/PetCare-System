package com.petcare.domain.hospital;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalRepository extends JpaRepository<Hospital, Long>, HospitalRepositoryCustom {

	List<Hospital> findAllByOwnerIdOrderByNameAsc(Long ownerId);

	// 데모 데이터 시더가 자기가 만든 병원을 이름으로 찾음
	List<Hospital> findAllByNameIn(Collection<String> names);
}
