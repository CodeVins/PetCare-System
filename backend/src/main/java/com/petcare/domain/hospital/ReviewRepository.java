package com.petcare.domain.hospital;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByUserIdAndHospitalId(Long userId, Long hospitalId);

	Page<Review> findAllByHospitalIdOrderByCreatedAtDesc(Long hospitalId, Pageable pageable);

	long countByHospitalId(Long hospitalId);

	@Query("select avg(r.rating) from Review r where r.hospital.id = :hospitalId")
	Double findAverageRatingByHospitalId(@Param("hospitalId") Long hospitalId);
}
