import type { PageResponse, Waitlist } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function joinWaitlist({
  petId,
  slotId,
}: {
  petId: number
  slotId: number
}): ApiPromise<Waitlist> {
  return axiosInstance.post('/api/waitlists', { petId, slotId })
}

export function getMyWaitlist(): ApiPromise<PageResponse<Waitlist>> {
  return axiosInstance.get('/api/waitlists', { params: { size: 100 } })
}

export function leaveWaitlist(waitlistId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/waitlists/${waitlistId}`)
}
