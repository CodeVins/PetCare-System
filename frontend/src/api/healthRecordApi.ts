import type { HealthRecord, HealthRecordPayload, PageResponse } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getHealthRecords(petId: number | string): ApiPromise<PageResponse<HealthRecord>> {
  return axiosInstance.get(`/api/pets/${petId}/health-records`, { params: { size: 100 } })
}

export function createHealthRecord(
  petId: number | string,
  { type, recordedAt, content, weight, nextDueDate }: HealthRecordPayload,
): ApiPromise<HealthRecord> {
  return axiosInstance.post(`/api/pets/${petId}/health-records`, {
    type,
    recordedAt,
    content,
    weight,
    nextDueDate,
  })
}

export function updateHealthRecord(
  petId: number | string,
  recordId: number,
  { type, recordedAt, content, weight, nextDueDate }: HealthRecordPayload,
): ApiPromise<HealthRecord> {
  return axiosInstance.patch(`/api/pets/${petId}/health-records/${recordId}`, {
    type,
    recordedAt,
    content,
    weight,
    nextDueDate,
  })
}

export function deleteHealthRecord(petId: number | string, recordId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/pets/${petId}/health-records/${recordId}`)
}
