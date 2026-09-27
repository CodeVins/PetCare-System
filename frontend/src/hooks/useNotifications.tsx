import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { BASE_URL } from '../api/axiosInstance'
import { getUnreadCount } from '../api/notificationApi'
import { useAuth } from './useAuth'

interface NotificationContextValue {
  unreadCount: number
  refreshUnreadCount: () => void
  decrementUnread: () => void
  lastNotificationAt: number
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastNotificationAt, setLastNotificationAt] = useState(0)

  const refreshUnreadCount = () => {
    getUnreadCount()
      .then(({ data }) => setUnreadCount(data.data))
      .catch(() => {})
  }

  useEffect(() => {
    // 비회원이면 SSE 연결 자체를 하지 않는다
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    refreshUnreadCount()

    // 변경(2026-09-27): 끊기면 브라우저 자동 재연결에 맡기지 않고 직접 close → 인증 API
    // (unread-count) 한 번 호출해 axios 인터셉터가 만료 토큰을 reissue하게 한 뒤 최신
    // accessToken으로 새 EventSource 생성. 놓친 알림 수도 이 호출로 다시 맞춰짐.
    // (이전: 처음 토큰으로 한 번만 연결 → 백엔드 30분 타임아웃 후 자동 재연결이 만료
    // 토큰으로 401 → EventSource가 재시도 중단, 새로고침 전까지 알림이 안 옴)
    let eventSource: EventSource
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let disposed = false

    const connect = () => {
      const accessToken = localStorage.getItem('accessToken')
      eventSource = new EventSource(`${BASE_URL}/api/notifications/subscribe?token=${accessToken}`)
      eventSource.addEventListener('notification', () => {
        setUnreadCount((count) => count + 1)
        setLastNotificationAt(Date.now())
      })
      eventSource.onerror = () => {
        eventSource.close()
        // 서버가 내려가 있을 때 무한 연타하지 않도록 3초 간격
        retryTimer = setTimeout(() => {
          getUnreadCount()
            .then(({ data }) => setUnreadCount(data.data))
            .catch(() => {})
            .finally(() => {
              if (!disposed) connect()
            })
        }, 3000)
      }
    }
    connect()

    return () => {
      disposed = true
      clearTimeout(retryTimer)
      eventSource.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const decrementUnread = () => {
    setUnreadCount((count) => Math.max(0, count - 1))
  }

  return (
    <NotificationContext
      value={{ unreadCount, refreshUnreadCount, decrementUnread, lastNotificationAt }}
    >
      {children}
    </NotificationContext>
  )
}

export function useNotifications(): NotificationContextValue {
  const context = use(NotificationContext)
  if (!context) throw new Error('useNotifications는 NotificationProvider 안에서만 쓸 수 있습니다.')
  return context
}
