import axiosInstance from './axiosInstance'

export function joinWaitlist({ petId, slotId }) {
  return axiosInstance.post('/api/waitlists', { petId, slotId })
}

export function getMyWaitlist() {
  return axiosInstance.get('/api/waitlists', { params: { size: 100 } })
}

export function leaveWaitlist(waitlistId) {
  return axiosInstance.delete(`/api/waitlists/${waitlistId}`)
}
