package com.petcare.domain.reservation;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

	List<Reservation> findAllByUserId(Long userId);

	boolean existsByUserIdAndSlot_Hospital_IdAndStatus(Long userId, Long hospitalId, ReservationStatus status);

	long countByStatus(ReservationStatus status);

	long countBySlot_Hospital_IdAndStatus(Long hospitalId, ReservationStatus status);

	@Query("select r from Reservation r where r.status = 'CONFIRMED' and r.slot.startTime >= :start and r.slot.startTime < :end")
	List<Reservation> findConfirmedReservationsStartingBetween(
			@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
