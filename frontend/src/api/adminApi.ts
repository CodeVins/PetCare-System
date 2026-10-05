import type {
  HospitalPeriodStats,
  HospitalStats,
  ManagedReview,
  PageResponse,
  ReviewFilter,
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

// 변경(2026-09-30): 필터·페이지 인자 추가 — 서버가 신고일/신고자/작성자/병원/숨김 필터를 받게 됨
// (이전: 인자 없이 size 100 한 페이지)
export function getReviewReports(
  filter: ReviewFilter = {},
  page = 0,
): ApiPromise<PageResponse<ReviewReport>> {
  return axiosInstance.get('/api/admin/reviews/reports', { params: { ...filter, page } })
}

export function getManagedReviews(
  filter: ReviewFilter = {},
  page = 0,
): ApiPromise<PageResponse<ManagedReview>> {
  return axiosInstance.get('/api/admin/reviews', { params: { ...filter, page } })
}

export function hideReview(reviewId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/reviews/${reviewId}/hide`)
}

export function unhideReview(reviewId: number): ApiPromise<null> {
  return axiosInstance.patch(`/api/admin/reviews/${reviewId}/unhide`)
}

// 병원 하나의 최근 N일(7/30/90) 운영 통계 — 관리자·해당 병원 소유자
export function getHospitalPeriodStats(
  hospitalId: number,
  days: 7 | 30 | 90,
): ApiPromise<HospitalPeriodStats> {
  return axiosInstance.get(`/api/admin/stats/hospitals/${hospitalId}`, { params: { days } })
}
