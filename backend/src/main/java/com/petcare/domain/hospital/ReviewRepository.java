package com.petcare.domain.hospital;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByUserIdAndHospitalId(Long userId, Long hospitalId);

	List<Review> findAllByHospitalIdOrderByCreatedAtDesc(Long hospitalId);

	long countByHospitalId(Long hospitalId);

	@Query("select avg(r.rating) from Review r where r.hospital.id = :hospitalId")
	Double findAverageRatingByHospitalId(@Param("hospitalId") Long hospitalId);
}
