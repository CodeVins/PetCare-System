import type {
  Notification,
  NotificationCategory,
  NotificationPreference,
  PageResponse,
} from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getNotifications(page = 0): ApiPromise<PageResponse<Notification>> {
  return axiosInstance.get('/api/notifications', { params: { page } })
}

export function getUnreadCount(): ApiPromise<number> {
  return axiosInstance.get('/api/notifications/unread-count')
}

export function getNotificationPreferences(): ApiPromise<NotificationPreference[]> {
  return axiosInstance.get('/api/notifications/preferences')
}

export function updateNotificationPreference(
  category: NotificationCategory,
  enabled: boolean,
): ApiPromise<null> {
  return axiosInstance.patch('/api/notifications/preferences', { category, enabled })
}

export function markNotificationAsRead(notificationId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/notifications/${notificationId}/read`)
}

// data = 읽음 처리된 건수
export function markAllNotificationsAsRead(): ApiPromise<number> {
  return axiosInstance.patch('/api/notifications/read-all')
}
