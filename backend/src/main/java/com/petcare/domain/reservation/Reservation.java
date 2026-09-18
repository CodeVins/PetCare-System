package com.petcare.domain.reservation;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.user.User;
import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reservation extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "slot_id", nullable = false)
	private Slot slot;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "pet_id", nullable = false)
	private Pet pet;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, columnDefinition = "varchar(20)")
	private ReservationStatus status;

	@Builder
	private Reservation(Slot slot, Pet pet, User user, ReservationStatus status) {
		this.slot = slot;
		this.pet = pet;
		this.user = user;
		this.status = status;
	}

	public boolean isOwnedBy(Long userId) {
		return this.user.getId().equals(userId);
	}

	public void cancel() {
		this.status = ReservationStatus.CANCELLED;
	}

	public void confirm() {
		this.status = ReservationStatus.CONFIRMED;
	}

	public void reject() {
		this.status = ReservationStatus.REJECTED;
	}
}
