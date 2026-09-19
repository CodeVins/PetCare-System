import axiosInstance from './axiosInstance'

export function getNotifications() {
  return axiosInstance.get('/api/notifications')
}

export function getUnreadCount() {
  return axiosInstance.get('/api/notifications/unread-count')
}

export function getNotificationPreferences() {
  return axiosInstance.get('/api/notifications/preferences')
}

export function updateNotificationPreference(category, enabled) {
  return axiosInstance.patch('/api/notifications/preferences', { category, enabled })
}

export function markNotificationAsRead(notificationId) {
  return axiosInstance.patch(`/api/notifications/${notificationId}/read`)
}
