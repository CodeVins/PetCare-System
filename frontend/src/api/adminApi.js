import axiosInstance from './axiosInstance'

export function getAllUsers() {
  return axiosInstance.get('/api/admin/users', { params: { size: 100 } })
}

export function getUserStats(userId) {
  return axiosInstance.get(`/api/admin/users/${userId}/stats`)
}

export function updateUserRole(userId, role) {
  return axiosInstance.patch(`/api/admin/users/${userId}/role`, { role })
}

export function suspendUser(userId) {
  return axiosInstance.patch(`/api/admin/users/${userId}/suspend`)
}

export function activateUser(userId) {
  return axiosInstance.patch(`/api/admin/users/${userId}/activate`)
}

export function getStatsSummary() {
  return axiosInstance.get('/api/admin/stats/summary')
}

export function getHospitalStats() {
  return axiosInstance.get('/api/admin/stats/hospitals')
}

export function updateHospitalOwner(hospitalId, ownerId) {
  return axiosInstance.patch(`/api/admin/hospitals/${hospitalId}/owner`, { ownerId })
}

export function runReminders() {
  return axiosInstance.post('/api/admin/reminders/run')
}

export function getReviewReports() {
  return axiosInstance.get('/api/admin/reviews/reports', { params: { size: 100 } })
}

export function hideReview(reviewId) {
  return axiosInstance.patch(`/api/admin/reviews/${reviewId}/hide`)
}

export function unhideReview(reviewId) {
  return axiosInstance.patch(`/api/admin/reviews/${reviewId}/unhide`)
}
