import {
  Bell,
  CalendarCheck,
  CalendarX,
  ChatCircleDots,
  Clock,
  Syringe,
  Stethoscope,
  type Icon,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../api/notificationApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { useNotifications } from '../../hooks/useNotifications'
import { usePagedList } from '../../hooks/usePagedList'
import { formatDateTime } from '../../lib/format'
import type { Notification, NotificationType } from '../../types/api'
import { useToast } from '../../hooks/useToast'

const TYPE_ICON: Partial<Record<NotificationType, Icon>> = {
  RESERVATION_REQUESTED: Clock,
  RESERVATION_CONFIRMED: CalendarCheck,
  RESERVATION_REJECTED: CalendarX,
  RESERVATION_CANCELLED: CalendarX,
  RESERVATION_REMINDER: Clock,
  VACCINATION_DUE_SOON: Syringe,
  FAVORITE_HOSPITAL_NEW_SLOT: CalendarCheck,
  CHAT_MESSAGE_RECEIVED: ChatCircleDots,
  WAITLIST_SLOT_AVAILABLE: Clock,
  TREATMENT_RECORDED: Stethoscope,
}

export default function NotificationListPage() {
  // 변경(2026-09-27): usePagedList로 "더 보기" 페이지네이션 (이전: 첫 페이지 20개만 보임)
  const {
    items: notifications,
    setItems: setNotifications,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
  } = usePagedList(getNotifications, null, '알림을 불러오지 못했습니다.')
  const toast = useToast()
  const navigate = useNavigate()
  const [markingAll, setMarkingAll] = useState(false)
  const { decrementUnread, refreshUnreadCount } = useNotifications()

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      const { data } = await markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
      toast(`알림 ${data.data}개를 읽음으로 표시했어요.`)
    } catch {
      // 실패해도 목록은 그대로 두고 뱃지만 서버 기준으로 다시 맞춤
      toast('읽음 처리에 실패했어요.', 'error')
    } finally {
      refreshUnreadCount()
      setMarkingAll(false)
    }
  }

  const handleClick = async (notification: Notification) => {
    // 변경(2026-10-02): 채팅 알림은 누르면 채팅 목록으로 이동 (이전: 읽음 처리만)
    if (notification.type === 'CHAT_MESSAGE_RECEIVED') navigate('/chats')
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

  // 변경(2026-09-27): 불러온 목록 대신 전역 뱃지 수 사용 — 페이지 단위로 받으면 아직 안
  // 불러온 안읽음이 빠지기 때문 (이전: notifications.filter(!read).length)
  const { unreadCount } = useNotifications()

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="알림"
        subtitle={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : undefined}
        action={
          unreadCount > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMarkAll}
              loading={markingAll}
            >
              모두 읽음
            </Button>
          )
        }
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
            // 변경(2026-10-02): 채팅 알림은 하늘색으로 구분 + "채팅" 라벨 (이전: 모든 알림이 같은 브랜드색)
            const isChat = notification.type === 'CHAT_MESSAGE_RECEIVED'
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                  notification.read
                    ? 'bg-white hover:bg-stone-50'
                    : isChat
                      ? 'bg-sky-50'
                      : 'bg-brand-50'
                }`}
              >
                <span
                  className={`icon-badge ${
                    notification.read ? 'bg-stone-100 text-stone-600' : isChat ? 'icon-badge-sky' : ''
                  }`}
                >
                  <Icon size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  {isChat && (
                    <span className="badge bg-sky-100 text-xs text-sky-700">채팅</span>
                  )}
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
                      className={`size-2.5 rounded-full ${isChat ? 'bg-sky-600' : 'bg-brand-600'}`}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!loading && !error && hasMore && (
        <Button
          type="button"
          variant="secondary"
          onClick={loadMore}
          loading={loadingMore}
          className="mt-4 w-full"
        >
          더 보기
        </Button>
      )}
    </div>
  )
}
