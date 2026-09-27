import axiosInstance from './axiosInstance'

export function getHealthRecords(petId) {
  return axiosInstance.get(`/api/pets/${petId}/health-records`, { params: { size: 100 } })
}

export function createHealthRecord(petId, { type, recordedAt, content, weight, nextDueDate }) {
  return axiosInstance.post(`/api/pets/${petId}/health-records`, {
    type,
    recordedAt,
    content,
    weight,
    nextDueDate,
  })
}

export function updateHealthRecord(
  petId,
  recordId,
  { type, recordedAt, content, weight, nextDueDate },
) {
  return axiosInstance.patch(`/api/pets/${petId}/health-records/${recordId}`, {
    type,
    recordedAt,
    content,
    weight,
    nextDueDate,
  })
}

export function deleteHealthRecord(petId, recordId) {
  return axiosInstance.delete(`/api/pets/${petId}/health-records/${recordId}`)
}
