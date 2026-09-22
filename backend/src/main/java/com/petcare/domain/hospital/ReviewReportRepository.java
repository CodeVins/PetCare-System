package com.petcare.domain.hospital;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, Long> {

	boolean existsByReviewIdAndReporterId(Long reviewId, Long reporterId);

	Page<ReviewReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

	Page<ReviewReport> findAllByReview_Hospital_OwnerIdOrderByCreatedAtDesc(Long ownerId, Pageable pageable);
}
