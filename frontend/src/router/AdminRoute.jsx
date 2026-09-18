import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminRoute() {
  const { role } = useAuth()

  if (role === null) {
    return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />
  }

  return role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}
