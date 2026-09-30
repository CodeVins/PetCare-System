package com.petcare.domain.hospital;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// 변경(2026-09-30): 관리 화면 필터 검색용 Querydsl 커스텀(ReviewRepositoryCustom) 추가 (이전: JpaRepository만)
public interface ReviewRepository extends JpaRepository<Review, Long>, ReviewRepositoryCustom {

	boolean existsByUserIdAndHospitalId(Long userId, Long hospitalId);

	Page<Review> findAllByHospitalIdAndHiddenFalseOrderByCreatedAtDesc(Long hospitalId, Pageable pageable);

	Page<Review> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

	long countByHospitalIdAndHiddenFalse(Long hospitalId);

	@Query("select avg(r.rating) from Review r where r.hospital.id = :hospitalId and r.hidden = false")
	Double findAverageRatingByHospitalId(@Param("hospitalId") Long hospitalId);
}
