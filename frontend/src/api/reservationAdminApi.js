import axiosInstance from './axiosInstance'

export function getAdminReservations(status) {
  return axiosInstance.get('/api/admin/reservations', { params: { status } })
}

export function confirmReservation(reservationId) {
  return axiosInstance.patch(`/api/admin/reservations/${reservationId}/confirm`)
}

export function rejectReservation(reservationId) {
  return axiosInstance.patch(`/api/admin/reservations/${reservationId}/reject`)
}

export function noShowReservation(reservationId) {
  return axiosInstance.patch(`/api/admin/reservations/${reservationId}/no-show`)
}
