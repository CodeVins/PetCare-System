import type {
  DayOfWeek,
  Hospital,
  HospitalPayload,
  HospitalSearchParams,
  PageResponse,
  Slot,
  SlotBulkPayload,
  SlotBulkResult,
  SlotStatus,
} from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

// 목록·상세·슬롯 조회(GET)는 비회원도 호출 가능 (백엔드 SecurityConfig PUBLIC_GET_PATHS)
export function getHospitals(params?: HospitalSearchParams): ApiPromise<Hospital[]> {
  return axiosInstance.get('/api/hospitals', { params })
}

export function getHospital(hospitalId: number | string): ApiPromise<Hospital> {
  return axiosInstance.get(`/api/hospitals/${hospitalId}`)
}

export function createHospital(payload: HospitalPayload): ApiPromise<Hospital> {
  return axiosInstance.post('/api/hospitals', payload)
}

export function updateHospital(hospitalId: number, payload: HospitalPayload): ApiPromise<Hospital> {
  return axiosInstance.patch(`/api/hospitals/${hospitalId}`, payload)
}

export function createSlot(
  hospitalId: number,
  { startTime, endTime }: { startTime: string; endTime: string },
): ApiPromise<Slot> {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/slots`, { startTime, endTime })
}

// 지난 시간·기존 슬롯과 겹치는 칸은 서버가 건너뛰고 { created, skipped }로 알려준다
export function createSlotsBulk(
  hospitalId: number,
  payload: SlotBulkPayload,
): ApiPromise<SlotBulkResult> {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/slots/bulk`, payload)
}

export function deleteSlot(hospitalId: number, slotId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/slots/${slotId}`)
}

// 서버가 지난 슬롯을 빼고 시작 시간순으로 내려준다
export function getSlots(
  hospitalId: number | string,
  status?: SlotStatus,
): ApiPromise<PageResponse<Slot>> {
  // size: 100 — slots are paginated now (default 20); bump so a hospital's
  // full slot list realistically fits on one page without adding pager UI.
  return axiosInstance.get(`/api/hospitals/${hospitalId}/slots`, {
    params: { status, size: 100 },
  })
}

export function addFavorite(hospitalId: number): ApiPromise<null> {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/favorites`)
}

export function removeFavorite(hospitalId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/favorites`)
}

export function getFavorites(): ApiPromise<PageResponse<Hospital>> {
  // size: 100 — see getSlots comment above, same reasoning for a small demo dataset.
  return axiosInstance.get('/api/favorites', { params: { size: 100 } })
}

export function uploadHospitalImage(hospitalId: number, file: File): ApiPromise<Hospital> {
  const formData = new FormData()
  formData.append('file', file)
  return axiosInstance.post(`/api/hospitals/${hospitalId}/image`, formData)
}

export function deleteHospitalImage(hospitalId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/image`)
}

// 요일별 진료 시간 전체 교체(빈 배열이면 삭제) — 관리자·해당 병원 소유자
export function updateOpeningHours(
  hospitalId: number,
  hours: { dayOfWeek: DayOfWeek; openTime: string; closeTime: string }[],
): ApiPromise<Hospital> {
  return axiosInstance.put(`/api/hospitals/${hospitalId}/opening-hours`, { hours })
}
