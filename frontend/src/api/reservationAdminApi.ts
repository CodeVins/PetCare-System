import type { PageResponse, Reservation, ReservationStatus } from '../types/api'
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
