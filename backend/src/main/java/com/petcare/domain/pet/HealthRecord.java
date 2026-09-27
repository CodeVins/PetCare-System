package com.petcare.domain.pet;

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
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
// 매일 09시 접종 리마인더가 next_due_date 범위로 전체 기록을 훑음 — 인덱스 없으면 풀스캔
@Table(indexes = @Index(name = "idx_health_record_next_due", columnList = "next_due_date"))
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

	@Builder
	private HealthRecord(
			Pet pet, HealthRecordType type, LocalDate recordedAt, String content, Double weight, LocalDate nextDueDate) {
		this.pet = pet;
		this.type = type;
		this.recordedAt = recordedAt;
		this.content = content;
		this.weight = weight;
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
