package com.petcare.domain.pet;

import com.petcare.domain.reservation.Reservation;
import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
// 매일 09시 접종 리마인더가 next_due_date 범위로 전체 기록을 훑음 — 인덱스 없으면 풀스캔
// 변경(2026-10-31): (routine_id, recorded_at) 유니크 — 루틴 완료 체크는 하루 한 번 (이전: 인덱스만)
@Table(indexes = @Index(name = "idx_health_record_next_due", columnList = "next_due_date"),
		uniqueConstraints = @UniqueConstraint(name = "uk_health_record_routine_date", columnNames = {"routine_id", "recorded_at"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HealthRecord extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "pet_id", nullable = false)
	private Pet pet;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, columnDefinition = "varchar(30)")
	private HealthRecordType type;

	@Column(name = "recorded_at", nullable = false)
	private LocalDate recordedAt;

	@Column(nullable = false)
	private String content;

	private Double weight;

	@Column(name = "next_due_date")
	private LocalDate nextDueDate;

	// 접종 리마인더를 이미 보낸 예정일. nextDueDate와 같으면 발송 완료 — 예정일을 수정하면 값이 달라져서
	// 별도 초기화 없이 새 예정일로 다시 알림이 감
	@Column(name = "reminded_due_date")
	private LocalDate remindedDueDate;

	// 병원이 진료 후 작성한 기록이면 해당 예약(예약당 1개), 보호자가 직접 쓴 기록이면 null
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "reservation_id", unique = true)
	private Reservation reservation;

	// 루틴 완료 체크로 생긴 기록이면 그 루틴(루틴을 지우면 null로 떼어내고 기록은 남김)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "routine_id")
	private PetRoutine routine;

	// 변경(2026-10-05): reservation 파라미터 추가 — 병원 작성 진료 기록 생성용 (이전: 보호자 작성 기록만)
	// 변경(2026-10-31): routine 파라미터 추가 — 루틴 완료 체크 기록용 (이전: 없음)
	@Builder
	private HealthRecord(
			Pet pet, HealthRecordType type, LocalDate recordedAt, String content, Double weight, LocalDate nextDueDate,
			Reservation reservation, PetRoutine routine) {
		this.pet = pet;
		this.type = type;
		this.recordedAt = recordedAt;
		this.content = content;
		this.weight = weight;
		this.nextDueDate = nextDueDate;
		this.reservation = reservation;
		this.routine = routine;
	}

	public boolean isWrittenByHospital() {
		return reservation != null;
	}

	// 병원 작성 기록 수정 — 날짜·체중은 예약 기준이라 안 바뀜
	public void updateTreatment(HealthRecordType type, String content, LocalDate nextDueDate) {
		this.type = type;
		this.content = content;
		this.nextDueDate = nextDueDate;
	}

	public void update(HealthRecordType type, LocalDate recordedAt, String content, Double weight, LocalDate nextDueDate) {
		this.type = type;
		this.recordedAt = recordedAt;
		this.content = content;
		this.weight = weight;
		this.nextDueDate = nextDueDate;
	}

	public void markReminded() {
		this.remindedDueDate = this.nextDueDate;
	}
}
