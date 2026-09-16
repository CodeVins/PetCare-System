import axiosInstance from './axiosInstance'

export function getNotifications() {
  return axiosInstance.get('/api/notifications')
}

export function markNotificationAsRead(notificationId) {
  return axiosInstance.patch(`/api/notifications/${notificationId}/read`)
}
