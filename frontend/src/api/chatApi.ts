import type { ChatMessage, ChatRoom, PageResponse } from '../types/api'
import { Client } from '@stomp/stompjs'
import axiosInstance, { BASE_URL, type ApiPromise } from './axiosInstance'

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

// 헤더 채팅 아이콘 배지 — 내 모든 채팅방의 안 읽은 메시지 합계
export function getChatUnreadCount(): ApiPromise<number> {
  return axiosInstance.get('/api/chat-rooms/unread-count')
}

// 지금까지 온 메시지를 전부 읽음으로 — 채팅방 진입·열어둔 채 새 메시지 수신 때 호출
export function markChatRoomRead(roomId: number | string): ApiPromise<void> {
  return axiosInstance.patch(`/api/chat-rooms/${roomId}/read`)
}

// 채팅방 실시간 수신(STOMP over WebSocket) — 전송은 위 sendChatMessage(REST) 그대로.
// 끊기면 3초 뒤 자동 재연결. 재연결·인증 실패 때 onResync를 불러서 끊긴 사이 놓친 메시지를 다시 조회하게 함
// (그 REST 호출이 401이면 axios 인터셉터가 토큰을 재발급 → 다음 재연결이 새 토큰으로 붙음)
export function subscribeChatRoom(
  roomId: number | string,
  onMessage: (message: ChatMessage) => void,
  onResync: () => void,
): () => void {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  let connectedOnce = false
  const client = new Client({
    brokerURL: `${scheme}://${window.location.host}${BASE_URL}/api/ws`,
    reconnectDelay: 3000,
    beforeConnect: () => {
      client.connectHeaders = { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` }
    },
    onConnect: () => {
      client.subscribe(`/topic/chat-rooms/${roomId}`, (frame) => onMessage(JSON.parse(frame.body)))
      if (connectedOnce) onResync()
      connectedOnce = true
    },
    onStompError: () => onResync(),
  })
  client.activate()
  return () => {
    void client.deactivate()
  }
}
