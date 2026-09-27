import axiosInstance from './axiosInstance'

export function getMe() {
  return axiosInstance.get('/api/users/me')
}

export function updateEmail(email) {
  return axiosInstance.patch('/api/users/me', { email })
}

export function changePassword({ currentPassword, newPassword }) {
  return axiosInstance.patch('/api/users/me/password', {
    currentPassword,
    newPassword,
  })
}

export function getUpcomingVaccinations() {
  return axiosInstance.get('/api/users/me/upcoming-vaccinations')
}
