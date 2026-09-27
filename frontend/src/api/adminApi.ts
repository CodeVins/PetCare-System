import type {
  HospitalStats,
  PageResponse,
  ReviewReport,
  Role,
  StatsSummary,
  User,
  UserStats,
} from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getAllUsers(): ApiPromise<PageResponse<User>> {
  return axiosInstance.get('/api/admin/users', { params: { size: 100 } })
}

export function getUserStats(userId: number | string): ApiPromise<UserStats> {
  return axiosInstance.get(`/api/admin/users/${userId}/stats`)
}

export function updateUserRole(userId: number, role: Role): ApiPromise<User> {
  return axiosInstance.patch(`/api/admin/users/${userId}/role`, { role })
}

export function suspendUser(userId: number): ApiPromise<User> {
  return axiosInstance.patch(`/api/admin/users/${userId}/suspend`)
}

export function activateUser(userId: number): ApiPromise<User> {
  return axiosInstance.patch(`/api/admin/users/${userId}/activate`)
}

export function getStatsSummary(): ApiPromise<StatsSummary> {
  return axiosInstance.get('/api/admin/stats/summary')
}

export function getHospitalStats(): ApiPromise<HospitalStats[]> {
  return axiosInstance.get('/api/admin/stats/hospitals')
}

export function updateHospitalOwner(hospitalId: number, ownerId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/hospitals/${hospitalId}/owner`, { ownerId })
}

export function runReminders(): ApiPromise<null> {
  return axiosInstance.post('/api/admin/reminders/run')
}

export function getReviewReports(): ApiPromise<PageResponse<ReviewReport>> {
  return axiosInstance.get('/api/admin/reviews/reports', { params: { size: 100 } })
}

export function hideReview(reviewId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/reviews/${reviewId}/hide`)
}

export function unhideReview(reviewId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/reviews/${reviewId}/unhide`)
}
