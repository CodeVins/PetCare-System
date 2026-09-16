import axiosInstance from './axiosInstance'

export function createReservation({ petId, slotId }) {
  return axiosInstance.post('/api/reservations', { petId, slotId })
}

export function getMyReservations() {
  return axiosInstance.get('/api/reservations')
}

export function cancelReservation(reservationId) {
  return axiosInstance.patch(`/api/reservations/${reservationId}/cancel`)
}
