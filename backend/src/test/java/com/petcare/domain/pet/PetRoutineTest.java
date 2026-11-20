package com.petcare.domain.pet;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

// 반복 주기별 occursOn — 스프링 없이 엔티티만
class PetRoutineTest {

	private PetRoutine routine(RoutineRepeat repeat, Set<DayOfWeek> days, LocalDate start, LocalDate end) {
		return PetRoutine.builder().type(HealthRecordType.WALK).title("산책")
				.repeat(repeat).daysOfWeek(days).startDate(start).endDate(end).build();
	}

	@Test
	void 격주는_시작한_주부터_2주마다() {
		// 2026-11-18 수요일 시작, 월·수
		PetRoutine r = routine(RoutineRepeat.BIWEEKLY, Set.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY),
				LocalDate.of(2026, 11, 18), null);
		assertThat(r.occursOn(LocalDate.of(2026, 11, 16))).isFalse(); // 시작 전 (같은 주 월요일)
		assertThat(r.occursOn(LocalDate.of(2026, 11, 18))).isTrue();
		assertThat(r.occursOn(LocalDate.of(2026, 11, 23))).isFalse(); // 다음 주
		assertThat(r.occursOn(LocalDate.of(2026, 11, 25))).isFalse();
		assertThat(r.occursOn(LocalDate.of(2026, 11, 30))).isTrue(); // 2주 뒤 월요일
		assertThat(r.occursOn(LocalDate.of(2026, 12, 2))).isTrue();
		assertThat(r.occursOn(LocalDate.of(2026, 12, 1))).isFalse(); // 요일 아님
	}

	@Test
	void 매월은_같은_날_없는_달은_말일_요일은_무시() {
		PetRoutine r = routine(RoutineRepeat.MONTHLY, Set.of(DayOfWeek.MONDAY),
				LocalDate.of(2027, 1, 31), LocalDate.of(2027, 4, 30));
		assertThat(r.getDaysOfWeek()).isEmpty();
		assertThat(r.isOneTime()).isFalse();
		assertThat(r.occursOn(LocalDate.of(2027, 1, 31))).isTrue();
		assertThat(r.occursOn(LocalDate.of(2027, 2, 28))).isTrue(); // 2월엔 31일이 없어서 말일
		assertThat(r.occursOn(LocalDate.of(2027, 3, 28))).isFalse();
		assertThat(r.occursOn(LocalDate.of(2027, 3, 31))).isTrue();
		assertThat(r.occursOn(LocalDate.of(2027, 4, 30))).isTrue(); // 종료일(4월 말일)
		assertThat(r.occursOn(LocalDate.of(2027, 5, 31))).isFalse(); // 종료일 이후
	}

	@Test
	void 주기_없으면_매주_요일_없으면_일회성() {
		PetRoutine weekly = routine(null, Set.of(DayOfWeek.FRIDAY), LocalDate.of(2026, 11, 20), null);
		assertThat(weekly.getRepeat()).isEqualTo(RoutineRepeat.WEEKLY);
		assertThat(weekly.occursOn(LocalDate.of(2026, 11, 27))).isTrue();

		PetRoutine once = routine(RoutineRepeat.BIWEEKLY, Set.of(), LocalDate.of(2026, 11, 20), LocalDate.of(2026, 12, 31));
		assertThat(once.isOneTime()).isTrue();
		assertThat(once.getEndDate()).isNull();
		assertThat(once.occursOn(LocalDate.of(2026, 11, 20))).isTrue();
		assertThat(once.occursOn(LocalDate.of(2026, 12, 4))).isFalse();
	}
}
