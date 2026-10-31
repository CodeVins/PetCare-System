import type {
  CalendarEvent,
  FeedingCalculatorPayload,
  FeedingCalculatorResult,
  PageResponse,
  Pet,
  PetPayload,
} from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getMyPets(): ApiPromise<PageResponse<Pet>> {
  return axiosInstance.get('/api/pets')
}

// 기간 양끝 포함, 최대 62일. 내 펫 + 공동보호자 펫 (페이지네이션 없이 배열 그대로)
export function getCalendarEvents(from: string, to: string, petId?: number): ApiPromise<CalendarEvent[]> {
  return axiosInstance.get('/api/calendar', { params: { from, to, petId } })
}

export function getPet(petId: number | string): ApiPromise<Pet> {
  return axiosInstance.get(`/api/pets/${petId}`)
}

export function createPet({
  name,
  species,
  breed,
  birthDate,
  size,
  sex,
  neutered,
}: PetPayload): ApiPromise<Pet> {
  return axiosInstance.post('/api/pets', { name, species, breed, birthDate, size, sex, neutered })
}

export function updatePet(
  petId: number | string,
  { name, species, breed, birthDate, size, sex, neutered }: PetPayload,
): ApiPromise<Pet> {
  return axiosInstance.patch(`/api/pets/${petId}`, {
    name,
    species,
    breed,
    birthDate,
    size,
    sex,
    neutered,
  })
}

export function deletePet(petId: number | string): ApiPromise<null> {
  return axiosInstance.delete(`/api/pets/${petId}`)
}

export function uploadPetImage(petId: number | string, file: File): ApiPromise<Pet> {
  const formData = new FormData()
  formData.append('file', file)
  return axiosInstance.post(`/api/pets/${petId}/image`, formData)
}

export function deletePetImage(petId: number | string): ApiPromise<null> {
  return axiosInstance.delete(`/api/pets/${petId}/image`)
}

export function calculateFeeding(
  petId: number | string,
  payload: FeedingCalculatorPayload,
): ApiPromise<FeedingCalculatorResult> {
  return axiosInstance.post(`/api/pets/${petId}/feeding-calculator`, payload)
}
