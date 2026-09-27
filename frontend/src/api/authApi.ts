import axiosInstance from './axiosInstance'

export function signup({ email, password }) {
  return axiosInstance.post('/api/auth/signup', { email, password })
}

export function login({ email, password }) {
  return axiosInstance.post('/api/auth/login', { email, password })
}

export function logout() {
  return axiosInstance.post('/api/auth/logout')
}

export function requestPasswordReset(email) {
  return axiosInstance.post('/api/auth/password-reset/request', { email })
}

export function confirmPasswordReset(token, newPassword) {
  return axiosInstance.post('/api/auth/password-reset/confirm', { token, newPassword })
}
