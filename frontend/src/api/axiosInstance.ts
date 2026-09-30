import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, TokenResponse } from '../types/api'

// api 함수들의 공통 반환 타입 — 호출부에서 res.data.data가 T로 추론된다
export type ApiPromise<T> = Promise<AxiosResponse<ApiResponse<T>>>

// 변경(2026-09-30): 절대 주소(http://호스트:8080) → 같은 오리진 상대 경로('') — 운영은 Caddy가 /api·/uploads를
// backend로 프록시하고, 개발은 vite server.proxy가 8080으로 넘김 (이전: HTTPS 도메인에서 http:8080 호출이
// 혼합 콘텐츠로 차단됨. 휴대폰 LAN 접속은 프록시가 개발 PC에서 돌기 때문에 그대로 동작)
export const BASE_URL = ''

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

// 로그인 화면으로 보낼 때 이유를 넘기는 키 — LoginPage가 한 번 읽고 지운다
export const LOGIN_NOTICE_KEY = 'loginNotice'

function clearSession(notice?: string) {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  if (notice) sessionStorage.setItem(LOGIN_NOTICE_KEY, notice)
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
      if (localStorage.getItem('accessToken')) clearSession('로그인이 만료되었습니다. 다시 로그인해 주세요.')
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      const { data } = await reissueTokens(refreshToken)
      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
      return axiosInstance(originalRequest)
    } catch (reissueError) {
      // 변경(2026-09-27): 재발급이 403(정지 계정 등)이면 서버 문구를 로그인 화면에 전달, 그 외(만료 등)는
      // "다시 로그인" 안내 (이전: 이유 없이 /login으로만 이동 — 사용 중 정지되면 왜 튕겼는지 알 수 없었음)
      const forbidden = axios.isAxiosError(reissueError) && reissueError.response?.status === 403
      clearSession(
        forbidden
          ? errorMessage(reissueError, '계정을 사용할 수 없습니다.')
          : '로그인이 만료되었습니다. 다시 로그인해 주세요.',
      )
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
