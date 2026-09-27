import type { SignupResponse, TokenResponse } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

interface Credentials {
  email: string
  password: string
}

export function signup({ email, password }: Credentials): ApiPromise<SignupResponse> {
  return axiosInstance.post('/api/auth/signup', { email, password })
}

export function login({ email, password }: Credentials): ApiPromise<TokenResponse> {
  return axiosInstance.post('/api/auth/login', { email, password })
}

export function logout(): ApiPromise<null> {
  return axiosInstance.post('/api/auth/logout')
}

export function requestPasswordReset(email: string): ApiPromise<null> {
  return axiosInstance.post('/api/auth/password-reset/request', { email })
}

export function confirmPasswordReset(token: string, newPassword: string): ApiPromise<null> {
  return axiosInstance.post('/api/auth/password-reset/confirm', { token, newPassword })
}
