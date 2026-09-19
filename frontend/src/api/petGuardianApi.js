import axiosInstance from './axiosInstance'

export function getGuardians(petId) {
  return axiosInstance.get(`/api/pets/${petId}/guardians`)
}

export function inviteGuardian(petId, email) {
  return axiosInstance.post(`/api/pets/${petId}/guardians`, { email })
}

export function removeGuardian(petId, userId) {
  return axiosInstance.delete(`/api/pets/${petId}/guardians/${userId}`)
}

export function leaveGuardian(petId) {
  return axiosInstance.delete(`/api/pets/${petId}/guardians/me`)
}
