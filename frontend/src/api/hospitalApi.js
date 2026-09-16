import axiosInstance from './axiosInstance'

export function getHospitals() {
  return axiosInstance.get('/api/hospitals')
}

export function getHospital(hospitalId) {
  return axiosInstance.get(`/api/hospitals/${hospitalId}`)
}

export function getSlots(hospitalId, status) {
  return axiosInstance.get(`/api/hospitals/${hospitalId}/slots`, {
    params: status ? { status } : undefined,
  })
}
