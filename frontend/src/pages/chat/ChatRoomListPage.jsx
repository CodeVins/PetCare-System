import { ChatCircleDots } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyChatRooms } from '../../api/chatApi'
import { useAuth } from '../../hooks/useAuth'

export default function ChatRoomListPage() {
  const { role } = useAuth()
  const isOwnerView = role === 'HOSPITAL_OWNER' || role === 'ADMIN'

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyChatRooms()
      .then(({ data }) => setRooms(data.data.content))
      .catch((err) =>
        setError(err.response?.data?.message || '채팅 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-stone-900">채팅</h1>

      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rooms.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <ChatCircleDots size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">채팅 내역이 없습니다.</p>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="space-y-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/chats/${room.id}`}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-brand-200"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50">
                <ChatCircleDots weight="fill" size={20} className="text-brand-600" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">
                  {isOwnerView ? room.customerEmail : room.hospitalName}
                </p>
                {isOwnerView && (
                  <p className="truncate text-sm text-stone-500">{room.hospitalName}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
