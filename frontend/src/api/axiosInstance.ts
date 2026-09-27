import axios from 'axios'

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
let refreshPromise = null

function reissueTokens(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/api/auth/reissue`, { refreshToken })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint = originalRequest?.url?.startsWith('/api/auth/')

    if (error.response?.status !== 401 || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      clearSession()
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

export default axiosInstance
