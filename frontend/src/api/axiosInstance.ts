import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, TokenResponse } from '../types/api'

// api 함수들의 공통 반환 타입 — 호출부에서 res.data.data가 T로 추론된다
export type ApiPromise<T> = Promise<AxiosResponse<ApiResponse<T>>>

// ponytail: hostname mirrors whatever the page was loaded from (localhost in dev,
// LAN IP when opened from a phone on the same Wi-Fi) instead of a hardcoded host.
export const BASE_URL = `http://${window.location.hostname}:8080`

const axiosInstance = axios.create({
  baseURL: BASE_URL,
})

axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  window.location.href = '/login'
}

// ponytail: single in-flight reissue shared across concurrent 401s, since the
// backend rotates refreshToken on every reissue — parallel reissue calls with
// the same stale token would race and log the user out.
let refreshPromise: Promise<AxiosResponse<ApiResponse<TokenResponse>>> | null = null

function reissueTokens(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<TokenResponse>>(`${BASE_URL}/api/auth/reissue`, { refreshToken })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: RetryableConfig | undefined = error.config
    const isAuthEndpoint = originalRequest?.url?.startsWith('/api/auth/')

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      isAuthEndpoint ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      // 변경(2026-09-27): 토큰이 아예 없는 비회원이면 /login으로 튕기지 않고 에러만 돌려줌 — 비회원도
      // 홈·병원 둘러보기가 가능해져서, 화면이 "로그인 후 이용" 안내를 직접 띄운다
      // (이전: 토큰 없으면 무조건 clearSession()으로 /login 이동)
      if (localStorage.getItem('accessToken')) clearSession()
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      const { data } = await reissueTokens(refreshToken)
      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
      return axiosInstance(originalRequest)
    } catch {
      clearSession()
      return Promise.reject(error)
    }
  },
)

// 서버 응답의 message를 우선 쓰고 없으면 fallback — catch (err: unknown) 공용 처리
export function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(err)) {
    return err.response?.data?.message || fallback
  }
  return fallback
}

export default axiosInstance
