package com.petcare.domain.hospital;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {

	Optional<ReviewReply> findByReviewId(Long reviewId);

	List<ReviewReply> findAllByReviewIdIn(Collection<Long> reviewIds);

	boolean existsByReviewId(Long reviewId);

	long countByAuthorId(Long authorId);
}
