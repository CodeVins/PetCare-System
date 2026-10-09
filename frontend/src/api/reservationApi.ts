import type { PageResponse, Reservation, ReservationType, ReservationView } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

// 변경(2026-10-05): memo·healthCheckRecordId(선택) 추가 — 병원에 증상 메모와 최근 자가 문진 전달 (이전: 펫·슬롯·유형만)
export function createReservation(payload: {
  petId: number
  slotId: number
  type: ReservationType
  memo?: string | null
  healthCheckRecordId?: number | null
}): ApiPromise<Reservation> {
  return axiosInstance.post('/api/reservations', payload)
}

// 변경(2026-10-09): 반려동물·보기 필터 추가 — 서버가 거르고 시간순으로 정렬해 줌 (이전: 전체를 받아 화면에서 거름)
export function getMyReservations(
  page = 0,
  filter: { petId?: number | null; view?: ReservationView } = {},
): ApiPromise<PageResponse<Reservation>> {
  return axiosInstance.get('/api/reservations', {
    params: { page, petId: filter.petId ?? undefined, view: filter.view },
  })
}

// 보기별 개수(탭 배지) — 반려동물을 고르면 그 아이 기준
export function getMyReservationCounts(petId?: number | null): ApiPromise<Record<ReservationView, number>> {
  return axiosInstance.get('/api/reservations/counts', { params: { petId: petId ?? undefined } })
}

// 내 목록에서만 지움(병원 기록은 남음) — 취소·거절·노쇼 또는 시간이 지난 예약만
export function hideReservation(reservationId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/reservations/${reservationId}`)
}

// 취소·거절된 예약 한 번에 지우기 — 지운 개수 반환
export function hideCancelledReservations(): ApiPromise<number> {
  return axiosInstance.delete('/api/reservations/cancelled')
}

export function cancelReservation(reservationId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/reservations/${reservationId}/cancel`)
}

// 변경(2026-09-27): getSlotIndex()/getMyReservationsDetailed() 삭제 — ReservationResponse/WaitlistResponse가
// hospitalName/startTime/endTime/petName을 직접 내려주기 시작해서 조인이 필요 없어짐 (이전: 병원 전체 × 슬롯을
// N+1로 조회해 slotId로 조인, 슬롯 첫 페이지(20개)만 받아서 슬롯 많은 병원은 "병원 정보 없음"으로 보이던 버그도 있었음)

// 같은 병원의 다른 빈 시간으로 변경 — 확정된 예약도 다시 확정 대기(PENDING)가 됨
export function rescheduleReservation(reservationId: number, slotId: number): ApiPromise<Reservation> {
  return axiosInstance.patch(`/api/reservations/${reservationId}/reschedule`, { slotId })
}
