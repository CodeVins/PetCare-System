import axiosInstance from './axiosInstance'

export function getMyPets() {
  return axiosInstance.get('/api/pets')
}

export function getPet(petId) {
  return axiosInstance.get(`/api/pets/${petId}`)
}

export function createPet({ name, breed, birthDate }) {
  return axiosInstance.post('/api/pets', { name, breed, birthDate })
}

export function updatePet(petId, { name, breed, birthDate }) {
  return axiosInstance.patch(`/api/pets/${petId}`, { name, breed, birthDate })
}

export function deletePet(petId) {
  return axiosInstance.delete(`/api/pets/${petId}`)
}

export function uploadPetImage(petId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return axiosInstance.post(`/api/pets/${petId}/image`, formData)
}

export function deletePetImage(petId) {
  return axiosInstance.delete(`/api/pets/${petId}/image`)
}
