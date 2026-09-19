package com.petcare.domain.reservation;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {

	boolean existsBySlotIdAndUserId(Long slotId, Long userId);

	Page<Waitlist> findAllByUserId(Long userId, Pageable pageable);

	Optional<Waitlist> findFirstBySlotIdOrderByCreatedAtAsc(Long slotId);

	void deleteAllByPetId(Long petId);
}
