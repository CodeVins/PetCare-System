package com.petcare.domain.hospital;

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
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
// 병원별 슬롯 목록(hospital_id + start_time > now, start_time 정렬), 겹침 검사, 일괄 등록 기간 조회용
// (hospital_id 단일 FK 인덱스만으로는 시간 범위/정렬을 못 탐)
@Table(indexes = @Index(name = "idx_slot_hospital_start", columnList = "hospital_id, start_time"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Slot extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "hospital_id", nullable = false)
	private Hospital hospital;

	@Column(name = "start_time", nullable = false)
	private LocalDateTime startTime;

	@Column(name = "end_time", nullable = false)
	private LocalDateTime endTime;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, columnDefinition = "varchar(20)")
	private SlotStatus status;

	@Version
	private Long version;

	@Builder
	private Slot(Hospital hospital, LocalDateTime startTime, LocalDateTime endTime) {
		this.hospital = hospital;
		this.startTime = startTime;
		this.endTime = endTime;
		this.status = SlotStatus.AVAILABLE;
	}

	public boolean isAvailable() {
		return this.status == SlotStatus.AVAILABLE;
	}

	public boolean hasStarted() {
		return !this.startTime.isAfter(LocalDateTime.now());
	}

	public void reserve() {
		this.status = SlotStatus.RESERVED;
	}

	public void release() {
		this.status = SlotStatus.AVAILABLE;
	}
}
