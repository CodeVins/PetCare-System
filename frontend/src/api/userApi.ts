import type { UpcomingVaccination, User } from '../types/api'
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
