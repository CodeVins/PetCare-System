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
}
