import type {
  HealthCheckQuestion,
  HealthCheckResult,
  HealthCheckSubmitPayload,
} from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getHealthCheckQuestions(): ApiPromise<HealthCheckQuestion[]> {
  return axiosInstance.get('/api/health-check/questions')
}

export function submitHealthCheck(
  payload: HealthCheckSubmitPayload,
): ApiPromise<HealthCheckResult> {
  return axiosInstance.post('/api/health-check/submit', payload)
}
