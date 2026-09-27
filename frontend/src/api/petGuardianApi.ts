import type { PetGuardian } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getGuardians(petId: number | string): ApiPromise<PetGuardian[]> {
  return axiosInstance.get(`/api/pets/${petId}/guardians`)
}

export function inviteGuardian(petId: number | string, email: string): ApiPromise<PetGuardian> {
  return axiosInstance.post(`/api/pets/${petId}/guardians`, { email })
}

export function removeGuardian(petId: number | string, userId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/pets/${petId}/guardians/${userId}`)
}

export function leaveGuardian(petId: number | string): ApiPromise<null> {
  return axiosInstance.delete(`/api/pets/${petId}/guardians/me`)
}
