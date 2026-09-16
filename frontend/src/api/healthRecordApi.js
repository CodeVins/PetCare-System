import axiosInstance from './axiosInstance'

export function getHealthRecords(petId) {
  return axiosInstance.get(`/api/pets/${petId}/health-records`)
}

export function createHealthRecord(petId, { type, recordedAt, content, weight }) {
  return axiosInstance.post(`/api/pets/${petId}/health-records`, {
    type,
    recordedAt,
    content,
    weight,
  })
}

export function updateHealthRecord(petId, recordId, { type, recordedAt, content, weight }) {
  return axiosInstance.patch(`/api/pets/${petId}/health-records/${recordId}`, {
    type,
    recordedAt,
    content,
    weight,
  })
}

export function deleteHealthRecord(petId, recordId) {
  return axiosInstance.delete(`/api/pets/${petId}/health-records/${recordId}`)
}
