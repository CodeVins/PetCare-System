package com.petcare.domain.reservation;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

	Page<Reservation> findAllByUserId(Long userId, Pageable pageable);

	Page<Reservation> findAllByStatus(ReservationStatus status, Pageable pageable);

	Page<Reservation> findAllBySlot_Hospital_OwnerId(Long ownerId, Pageable pageable);

	Page<Reservation> findAllBySlot_Hospital_OwnerIdAndStatus(Long ownerId, ReservationStatus status, Pageable pageable);

	boolean existsByUserIdAndSlot_Hospital_IdAndStatus(Long userId, Long hospitalId, ReservationStatus status);

	boolean existsByPetId(Long petId);

	long countByUserId(Long userId);

	long countByUserIdAndStatus(Long userId, ReservationStatus status);

	long countByStatus(ReservationStatus status);

	long countBySlot_Hospital_IdAndStatus(Long hospitalId, ReservationStatus status);

	@Query("select r from Reservation r where r.status = 'CONFIRMED' and r.slot.startTime >= :start and r.slot.startTime < :end")
	List<Reservation> findConfirmedReservationsStartingBetween(
			@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
