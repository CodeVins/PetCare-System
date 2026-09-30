import type { Hospital, MyReview, PageResponse, UpcomingVaccination, User } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getMe(): ApiPromise<User> {
  return axiosInstance.get('/api/users/me')
}

export function updateEmail(email: string): ApiPromise<User> {
  return axiosInstance.patch('/api/users/me', { email })
}

export function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string
  newPassword: string
}): ApiPromise<null> {
  return axiosInstance.patch('/api/users/me/password', {
    currentPassword,
    newPassword,
  })
}

export function getUpcomingVaccinations(): ApiPromise<UpcomingVaccination[]> {
  return axiosInstance.get('/api/users/me/upcoming-vaccinations')
}

// 병원 관리 콘솔용 — 내가 소유자로 지정된 병원만 (배열 그대로)
export function getOwnedHospitals(): ApiPromise<Hospital[]> {
  return axiosInstance.get('/api/users/me/hospitals')
}

export function getMyReviews(page = 0): ApiPromise<PageResponse<MyReview>> {
  return axiosInstance.get('/api/users/me/reviews', { params: { page } })
}
