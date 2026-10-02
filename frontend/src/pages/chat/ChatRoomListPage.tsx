import { errorMessage } from '../../api/axiosInstance'
import { Buildings, ChatCircleDots } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyChatRooms } from '../../api/chatApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import type { ChatRoom } from '../../types/api'

const ACCENTS = [
  'bg-brand-100 text-brand-600',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
]

export default function ChatRoomListPage() {
  const { role } = useAuth()
  const isOwnerView = role === 'HOSPITAL_OWNER' || role === 'ADMIN'

  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 변경(2026-10-02): 알림이 오면 다시 조회해서 방별 안 읽은 수를 갱신 — 채팅방을 안 보고 있을 때 온 메시지는
  // 채팅 알림(SSE)으로 들어오므로 그걸 신호로 씀 (이전: 처음 한 번만 조회)
  const { lastNotificationAt } = useNotifications()
  useEffect(() => {
    getMyChatRooms()
      .then(({ data }) => setRooms(data.data.content))
      .catch((err) =>
        setError(errorMessage(err, '채팅 목록을 불러오지 못했습니다.')),
      )
      .finally(() => setLoading(false))
  }, [lastNotificationAt])

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="채팅" />

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-21 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && rooms.length === 0 && (
        <div className="card">
          <EmptyState
            icon={ChatCircleDots}
            action={
              !isOwnerView && (
                <Link to="/hospitals" className="btn btn-primary btn-sm">
                  병원에 문의하기
                </Link>
              )
            }
          >
            채팅 내역이 없습니다.
          </EmptyState>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="card divide-y divide-stone-100 overflow-hidden">
          {rooms.map((room, index) => (
            <Link
              key={room.id}
              to={`/chats/${room.id}`}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-stone-50"
            >
              <span
                className={`flex size-13 shrink-0 items-center justify-center rounded-[14px] ${
                  ACCENTS[index % ACCENTS.length]
                }`}
              >
                <Buildings size={26} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-bold">
                  {isOwnerView ? room.customerEmail : room.hospitalName}
                </span>
                {isOwnerView && (
                  <span className="truncate text-sm text-stone-600">
                    {room.hospitalName}
                  </span>
                )}
              </span>
              {room.unreadCount > 0 && (
                <span
                  aria-label={`안 읽은 메시지 ${room.unreadCount}개`}
                  className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold leading-none text-white"
                >
                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
