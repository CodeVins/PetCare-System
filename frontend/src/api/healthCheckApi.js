import axiosInstance from './axiosInstance'

export function getHealthCheckQuestions() {
  return axiosInstance.get('/api/health-check/questions')
}

export function submitHealthCheck(payload) {
  return axiosInstance.post('/api/health-check/submit', payload)
}
