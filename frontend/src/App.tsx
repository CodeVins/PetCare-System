import { AuthProvider } from './hooks/useAuth'
import { NotificationProvider } from './hooks/useNotifications'
import { ToastProvider } from './hooks/useToast'
import AppRouter from './router/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}
