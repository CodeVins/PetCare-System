import axiosInstance from './axiosInstance'

export function getHospitals(params) {
  return axiosInstance.get('/api/hospitals', { params })
}

export function getHospital(hospitalId) {
  return axiosInstance.get(`/api/hospitals/${hospitalId}`)
}

export function createHospital(payload) {
  return axiosInstance.post('/api/hospitals', payload)
}

export function updateHospital(hospitalId, payload) {
  return axiosInstance.patch(`/api/hospitals/${hospitalId}`, payload)
}

export function createSlot(hospitalId, { startTime, endTime }) {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/slots`, { startTime, endTime })
}

export function getSlots(hospitalId, status) {
  // size: 100 — slots are paginated now (default 20); bump so a hospital's
  // full slot list realistically fits on one page without adding pager UI.
  return axiosInstance.get(`/api/hospitals/${hospitalId}/slots`, {
    params: { status, size: 100 },
  })
}

export function addFavorite(hospitalId) {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/favorites`)
}

export function removeFavorite(hospitalId) {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/favorites`)
}

export function getFavorites() {
  // size: 100 — see getSlots comment above, same reasoning for a small demo dataset.
  return axiosInstance.get('/api/favorites', { params: { size: 100 } })
}

export function uploadHospitalImage(hospitalId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return axiosInstance.post(`/api/hospitals/${hospitalId}/image`, formData)
}

export function deleteHospitalImage(hospitalId) {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/image`)
}
