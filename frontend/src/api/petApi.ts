import type {
  CalendarEvent,
  FeedingCalculatorPayload,
  FeedingCalculatorResult,
  PageResponse,
  Pet,
  PetPayload,
  Routine,
  RoutinePayload,
} from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

// ── 반복 일정(루틴) — 완료 체크는 같은 종류의 건강 기록으로 남음(하루 한 번, 오늘까지만)
export function getRoutines(petId: number | string): ApiPromise<Routine[]> {
  return axiosInstance.get(`/api/pets/${petId}/routines`)
}

export function createRoutine(petId: number | string, payload: RoutinePayload): ApiPromise<Routine> {
  return axiosInstance.post(`/api/pets/${petId}/routines`, payload)
}

export function updateRoutine(petId: number | string, routineId: number, payload: RoutinePayload): ApiPromise<Routine> {
  return axiosInstance.put(`/api/pets/${petId}/routines/${routineId}`, payload)
}

export function deleteRoutine(petId: number | string, routineId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/pets/${petId}/routines/${routineId}`)
}

export function checkRoutine(petId: number, routineId: number, date: string): ApiPromise<null> {
  return axiosInstance.post(`/api/pets/${petId}/routines/${routineId}/checks/${date}`)
}

export function uncheckRoutine(petId: number, routineId: number, date: string): ApiPromise<null> {
  return axiosInstance.delete(`/api/pets/${petId}/routines/${routineId}/checks/${date}`)
}

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
