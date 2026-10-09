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
import java.time.LocalDate;
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

	@Enumerated(EnumType.STRING)
	@Column(columnDefinition = "varchar(20)")
	private ReservationType type;

	// 예약 리마인더 발송 여부 — 같은 날 스케줄러/수동 실행이 여러 번 돌아도 한 번만 보내기 위함
	@Column(name = "reminder_sent", nullable = false)
	private boolean reminderSent;

	// 보호자가 "내 예약"에서 지운 예약 — 행은 남김(슬롯·통계·리뷰 자격과 얽혀 있어서), 본인 목록에서만 안 보임
	@Column(name = "hidden_by_user", nullable = false)
	private boolean hiddenByUser;

	// 보호자가 예약하면서 남긴 증상·요청 메모
	@Column(length = 500)
	private String memo;

	// 예약 때 첨부한 자가 문진 결과의 복사본(요약 문구·작성일) — 원본 건강 기록을 나중에 지워도 병원은 예약 당시 내용을 그대로 봄
	@Column(name = "health_check_summary")
	private String healthCheckSummary;

	@Column(name = "health_check_date")
	private LocalDate healthCheckDate;

	// 변경(2026-10-05): memo·자가 문진 복사본 파라미터 추가 (이전: 슬롯·펫·유저·상태·진료 종류만)
	@Builder
	private Reservation(
			Slot slot, Pet pet, User user, ReservationStatus status, ReservationType type, String memo,
			String healthCheckSummary, LocalDate healthCheckDate) {
		this.slot = slot;
		this.pet = pet;
		this.user = user;
		this.status = status;
		this.type = type;
		this.memo = memo;
		this.healthCheckSummary = healthCheckSummary;
		this.healthCheckDate = healthCheckDate;
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

	public void markNoShow() {
		this.status = ReservationStatus.NO_SHOW;
	}

	// 같은 병원의 다른 시간으로 이동 — 병원이 새 시간을 다시 확인해야 하므로 PENDING으로, 리마인더도 새 시간 기준으로 다시
	public void reschedule(Slot newSlot) {
		this.slot = newSlot;
		this.status = ReservationStatus.PENDING;
		this.reminderSent = false;
	}

	public void markReminderSent() {
		this.reminderSent = true;
	}

	// 지울 수 있는 건 끝난 예약만 — 취소·거절·노쇼, 또는 시간이 지난 예약(진행 중인 예약은 먼저 취소해야 함)
	public boolean isHideable() {
		return status == ReservationStatus.CANCELLED || status == ReservationStatus.REJECTED
				|| status == ReservationStatus.NO_SHOW || slot.hasStarted();
	}

	public void hideFromUser() {
		this.hiddenByUser = true;
	}
}
