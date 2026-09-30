package com.petcare.domain.hospital;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// 변경(2026-09-30): 신고 목록 필터 검색용 Querydsl 커스텀 추가, 필터 없는 목록 메서드 2개(findAllByOrderByCreatedAtDesc,
// findAllByReview_Hospital_OwnerIdOrderByCreatedAtDesc)는 대체돼서 삭제 (이전: 최신순 목록만 — 신고일·신고자·작성자로 못 거름)
public interface ReviewReportRepository extends JpaRepository<ReviewReport, Long>, ReviewReportRepositoryCustom {

	boolean existsByReviewIdAndReporterId(Long reviewId, Long reporterId);

	@Query("select r.review.id, count(r) from ReviewReport r where r.review.id in :reviewIds group by r.review.id")
	List<Object[]> countByReviewIds(@Param("reviewIds") Collection<Long> reviewIds);
}
