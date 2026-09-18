import axiosInstance from './axiosInstance'

export function getOrCreateChatRoom(hospitalId) {
  return axiosInstance.post('/api/chat-rooms', { hospitalId })
}

export function getMyChatRooms() {
  return axiosInstance.get('/api/chat-rooms', { params: { size: 100 } })
}

export function getChatMessages(roomId) {
  return axiosInstance.get(`/api/chat-rooms/${roomId}/messages`, { params: { size: 100 } })
}

export function sendChatMessage(roomId, content) {
  return axiosInstance.post(`/api/chat-rooms/${roomId}/messages`, { content })
}
