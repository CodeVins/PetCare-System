import type {
  HealthRecord,
  ISODate,
  PageResponse,
  Reservation,
  ReservationStatus,
} from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getAdminReservations(
  status?: ReservationStatus,
  page = 0,
): ApiPromise<PageResponse<Reservation>> {
  return axiosInstance.get('/api/admin/reservations', { params: { status, page } })
}

export function confirmReservation(reservationId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/reservations/${reservationId}/confirm`)
}

export function rejectReservation(reservationId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/reservations/${reservationId}/reject`)
}

export function noShowReservation(reservationId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/reservations/${reservationId}/no-show`)
}

// 진료 기록 — 예약당 1개, 없으면 data가 null. 저장은 작성/수정 겸용(PUT)
export interface TreatmentRecordPayload {
  type: 'TREATMENT' | 'VACCINATION'
  content: string
  nextDueDate: ISODate | null
}

export function getTreatmentRecord(reservationId: number): ApiPromise<HealthRecord | null> {
  return axiosInstance.get(`/api/admin/reservations/${reservationId}/treatment`)
}

export function saveTreatmentRecord(
  reservationId: number,
  payload: TreatmentRecordPayload,
): ApiPromise<HealthRecord> {
  return axiosInstance.put(`/api/admin/reservations/${reservationId}/treatment`, payload)
}
