import type { ChatMessage, ChatRoom, PageResponse } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

export function getOrCreateChatRoom(hospitalId: number): ApiPromise<ChatRoom> {
  return axiosInstance.post('/api/chat-rooms', { hospitalId })
}

export function getMyChatRooms(): ApiPromise<PageResponse<ChatRoom>> {
  return axiosInstance.get('/api/chat-rooms', { params: { size: 100 } })
}

export function getChatMessages(roomId: number | string): ApiPromise<PageResponse<ChatMessage>> {
  return axiosInstance.get(`/api/chat-rooms/${roomId}/messages`, { params: { size: 100 } })
}

export function sendChatMessage(roomId: number | string, content: string): ApiPromise<ChatMessage> {
  return axiosInstance.post(`/api/chat-rooms/${roomId}/messages`, { content })
}
