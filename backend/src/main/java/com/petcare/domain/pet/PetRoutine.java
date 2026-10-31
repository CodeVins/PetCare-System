package com.petcare.domain.pet;

import com.petcare.global.common.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 반복 일정(매일 산책·급식, 투약 등). 날짜별 행을 만들지 않고 조회할 때 기간만큼 펼침(occursOn) —
// 수정하면 앞으로의 일정에 바로 반영. 요일이 비었으면 startDate 하루만 있는 일회성 일정
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetRoutine extends BaseEntity {

	// 루틴으로 만들 수 있는 종류 — 완료 체크가 같은 종류의 건강 기록으로 남음
	public static final Set<HealthRecordType> ALLOWED_TYPES = EnumSet.of(
			HealthRecordType.WALK, HealthRecordType.MEAL, HealthRecordType.MEDICATION, HealthRecordType.GROOMING);

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "pet_id", nullable = false)
	private Pet pet;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, columnDefinition = "varchar(30)")
	private HealthRecordType type;

	@Column(nullable = false, length = 50)
	private String title;

	// 하루 중 시각(캘린더 정렬·표시용). 없으면 "시간 무관"
	@Column(name = "routine_time")
	private LocalTime time;

	@ElementCollection
	@CollectionTable(name = "pet_routine_day", joinColumns = @JoinColumn(name = "routine_id"))
	@Enumerated(EnumType.STRING)
	@Column(name = "day_of_week", nullable = false, columnDefinition = "varchar(10)")
	private Set<DayOfWeek> daysOfWeek = new HashSet<>();

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	// null이면 끝없이 반복
	@Column(name = "end_date")
	private LocalDate endDate;

	@Builder
	private PetRoutine(
			Pet pet, HealthRecordType type, String title, LocalTime time, Set<DayOfWeek> daysOfWeek,
			LocalDate startDate, LocalDate endDate) {
		this.pet = pet;
		update(type, title, time, daysOfWeek, startDate, endDate);
	}

	public void update(
			HealthRecordType type, String title, LocalTime time, Set<DayOfWeek> daysOfWeek,
			LocalDate startDate, LocalDate endDate) {
		this.type = type;
		this.title = title;
		this.time = time;
		this.daysOfWeek.clear();
		if (daysOfWeek != null) {
			this.daysOfWeek.addAll(daysOfWeek);
		}
		this.startDate = startDate;
		this.endDate = endDate;
	}

	public boolean isOneTime() {
		return daysOfWeek.isEmpty();
	}

	public boolean occursOn(LocalDate date) {
		if (isOneTime()) {
			return date.equals(startDate);
		}
		return !date.isBefore(startDate)
				&& (endDate == null || !date.isAfter(endDate))
				&& daysOfWeek.contains(date.getDayOfWeek());
	}
}
