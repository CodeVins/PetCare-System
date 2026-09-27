import {
  Bell,
  CalendarCheck,
  CalendarX,
  ChatCircleDots,
  Clock,
  Syringe,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getNotifications, markNotificationAsRead } from '../../api/notificationApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDateTime } from '../../lib/format'

const TYPE_ICON = {
  RESERVATION_REQUESTED: Clock,
  RESERVATION_CONFIRMED: CalendarCheck,
  RESERVATION_REJECTED: CalendarX,
  RESERVATION_CANCELLED: CalendarX,
  RESERVATION_REMINDER: Clock,
  VACCINATION_DUE_SOON: Syringe,
  FAVORITE_HOSPITAL_NEW_SLOT: CalendarCheck,
  CHAT_MESSAGE_RECEIVED: ChatCircleDots,
  WAITLIST_SLOT_AVAILABLE: Clock,
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

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="알림"
        subtitle={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : undefined}
      />

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && notifications.length === 0 && (
        <div className="card">
          <EmptyState icon={Bell}>알림이 없습니다.</EmptyState>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="card divide-y divide-stone-200 overflow-hidden">
          {notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type] || Bell
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                  notification.read ? 'bg-white hover:bg-stone-50' : 'bg-brand-50'
                }`}
              >
                <span
                  className={`icon-badge ${
                    notification.read ? 'bg-stone-100 text-stone-600' : ''
                  }`}
                >
                  <Icon size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={notification.read ? 'font-medium' : 'font-bold'}>
                    {notification.content}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs text-stone-600">
                    {formatDateTime(notification.createdAt)}
                  </span>
                  {!notification.read && (
                    <span
                      aria-label="읽지 않음"
                      className="size-2.5 rounded-full bg-brand-600"
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
