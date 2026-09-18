import { createContext, useContext, useEffect, useState } from 'react'
import { BASE_URL } from '../api/axiosInstance'
import { getUnreadCount } from '../api/notificationApi'
import { useAuth } from './useAuth'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastNotificationAt, setLastNotificationAt] = useState(0)

  const refreshUnreadCount = () => {
    getUnreadCount()
      .then(({ data }) => setUnreadCount(data.data))
      .catch(() => {})
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    refreshUnreadCount()

    // ponytail: connects once per login with the current accessToken. If the
    // connection drops after the token rotates (1hr), the browser's native
    // EventSource retry will fail auth — reconnect-with-fresh-token would need
    // its own lifecycle wiring, skipped for portfolio scope.
    const accessToken = localStorage.getItem('accessToken')
    const eventSource = new EventSource(
      `${BASE_URL}/api/notifications/subscribe?token=${accessToken}`,
    )
    eventSource.addEventListener('notification', () => {
      setUnreadCount((count) => count + 1)
      setLastNotificationAt(Date.now())
    })

    return () => eventSource.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const decrementUnread = () => {
    setUnreadCount((count) => Math.max(0, count - 1))
  }

  return (
    <NotificationContext.Provider
      value={{ unreadCount, refreshUnreadCount, decrementUnread, lastNotificationAt }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
