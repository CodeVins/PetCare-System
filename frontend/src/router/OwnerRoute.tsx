import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { OWNER_ROLES } from '../lib/roles'

export default function OwnerRoute() {
  const { role } = useAuth()

  if (role === null) {
    return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />
  }

  return OWNER_ROLES.includes(role) ? <Outlet /> : <Navigate to="/" replace />
}
