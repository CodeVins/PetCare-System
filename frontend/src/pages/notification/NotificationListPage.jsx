import { Bell, CalendarCheck, Clock, Syringe, XCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getNotifications, markNotificationAsRead } from '../../api/notificationApi'
import { useNotifications } from '../../hooks/useNotifications'

// FAVORITE_HOSPITAL_NEW_SLOT / CHAT_MESSAGE_RECEIVED fall back to the default
// Bell icon below — those features aren't built yet.
const TYPE_ICON = {
  RESERVATION_REQUESTED: Clock,
  RESERVATION_CONFIRMED: CalendarCheck,
  RESERVATION_REJECTED: XCircle,
  RESERVATION_CANCELLED: XCircle,
  RESERVATION_REMINDER: Clock,
  VACCINATION_DUE_SOON: Syringe,
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationListPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { decrementUnread, refreshUnreadCount } = useNotifications()

  useEffect(() => {
    getNotifications()
      .then(({ data }) => setNotifications(data.data.content))
      .catch((err) => setError(err.response?.data?.message || '알림을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleClick = async (notification) => {
    if (notification.read) return
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    )
    decrementUnread()
    try {
      await markNotificationAsRead(notification.id)
    } catch {
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: false } : item)),
      )
      refreshUnreadCount()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">알림</h1>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <Bell size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">알림이 없습니다.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type] || Bell
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  notification.read
                    ? 'border-stone-200 bg-white'
                    : 'border-brand-200 bg-brand-50'
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    notification.read
                      ? 'bg-stone-100 text-stone-400'
                      : 'bg-brand-100 text-brand-600'
                  }`}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm ${notification.read ? 'text-stone-600' : 'font-medium text-stone-900'}`}
                  >
                    {notification.content}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
