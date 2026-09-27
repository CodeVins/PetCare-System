import type { PageResponse, Reservation, ReservationType } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function createReservation({
  petId,
  slotId,
  type,
}: {
  petId: number
  slotId: number
  type: ReservationType
}): ApiPromise<Reservation> {
  return axiosInstance.post('/api/reservations', { petId, slotId, type })
}

export function getMyReservations(page = 0): ApiPromise<PageResponse<Reservation>> {
  return axiosInstance.get('/api/reservations', { params: { page } })
}

export function cancelReservation(reservationId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/reservations/${reservationId}/cancel`)
}

// 변경(2026-09-27): getSlotIndex()/getMyReservationsDetailed() 삭제 — ReservationResponse/WaitlistResponse가
// hospitalName/startTime/endTime/petName을 직접 내려주기 시작해서 조인이 필요 없어짐 (이전: 병원 전체 × 슬롯을
// N+1로 조회해 slotId로 조인, 슬롯 첫 페이지(20개)만 받아서 슬롯 많은 병원은 "병원 정보 없음"으로 보이던 버그도 있었음)
