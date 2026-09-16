import axiosInstance from './axiosInstance'

export function signup({ email, password }) {
  return axiosInstance.post('/api/auth/signup', { email, password })
}

export function login({ email, password }) {
  return axiosInstance.post('/api/auth/login', { email, password })
}
