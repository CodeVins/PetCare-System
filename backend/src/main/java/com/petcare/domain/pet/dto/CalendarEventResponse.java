package com.petcare.domain.pet.dto;

import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.pet.CalendarEventKind;
import com.petcare.domain.pet.HealthRecord;
import com.petcare.domain.pet.HealthRecordType;
import com.petcare.domain.pet.PetRoutine;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.user.User;
import java.time.LocalDate;
import java.time.LocalTime;

// 캘린더 한 칸에 찍히는 일정. kind에 따라 채워지는 필드가 다름:
// RESERVATION → time·reservationId·reservationStatus·hospital, RECORD/DUE → recordId·recordType(병원 작성이면 hospital도),
// ROUTINE → time·recordType·routineId·done(완료면 체크한 사람 doneByUserId·doneByEmail — 체크 기록에 작성자가 있을 때만)
public record CalendarEventResponse(
		CalendarEventKind kind,
		LocalDate date,
		LocalTime time,
		Long petId,
		String petName,
		String title,
		Long recordId,
		HealthRecordType recordType,
		Long reservationId,
		ReservationStatus reservationStatus,
		Long hospitalId,
		String hospitalName,
		Long routineId,
		Boolean done,
		Long doneByUserId,
		String doneByEmail
) {

	// doneRecord: 그날 완료 체크로 생긴 기록, 안 했으면 null
	public static CalendarEventResponse ofRoutine(PetRoutine routine, LocalDate date, HealthRecord doneRecord) {
		User doneBy = doneRecord == null ? null : doneRecord.getRecordedBy();
		return new CalendarEventResponse(
				CalendarEventKind.ROUTINE, date, routine.getTime(),
				routine.getPet().getId(), routine.getPet().getName(),
				routine.getTitle(),
				null, routine.getType(),
				null, null, null, null,
				routine.getId(), doneRecord != null,
				doneBy == null ? null : doneBy.getId(), doneBy == null ? null : doneBy.getEmail());
	}

	public static CalendarEventResponse ofReservation(Reservation reservation) {
		Hospital hospital = reservation.getSlot().getHospital();
		return new CalendarEventResponse(
				CalendarEventKind.RESERVATION,
				reservation.getSlot().getStartTime().toLocalDate(),
				reservation.getSlot().getStartTime().toLocalTime(),
				reservation.getPet().getId(), reservation.getPet().getName(),
				hospital.getName(),
				null, null,
				reservation.getId(), reservation.getStatus(),
				hospital.getId(), hospital.getName(),
				null, null, null, null);
	}

	public static CalendarEventResponse ofRecord(HealthRecord record) {
		return fromRecord(CalendarEventKind.RECORD, record.getRecordedAt(), record);
	}

	public static CalendarEventResponse ofDue(HealthRecord record) {
		return fromRecord(CalendarEventKind.DUE, record.getNextDueDate(), record);
	}

	private static CalendarEventResponse fromRecord(CalendarEventKind kind, LocalDate date, HealthRecord record) {
		Hospital hospital = record.isWrittenByHospital() ? record.getReservation().getSlot().getHospital() : null;
		return new CalendarEventResponse(
				kind, date, null,
				record.getPet().getId(), record.getPet().getName(),
				record.getContent(),
				record.getId(), record.getType(),
				null, null,
				hospital == null ? null : hospital.getId(), hospital == null ? null : hospital.getName(),
				null, null, null, null);
	}
}
