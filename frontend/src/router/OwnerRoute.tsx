import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// 변경(2026-09-30): HOSPITAL_OWNER 전용으로 좁히고 비회원은 로그인 화면으로 — 병원 관리 콘솔이 소비자 Layout
// 밖(AdminLayout 쉘)으로 나가서 PrivateRoute 안내를 못 받음. ADMIN은 /admin에서 전체를 관리하므로 그쪽으로
// (이전: OWNER_ROLES(HOSPITAL_OWNER+ADMIN) 허용, PrivateRoute 아래에서 렌더)
export default function OwnerRoute() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: '/dashboard' }} />
  if (role === null) return <div className="min-h-dvh animate-pulse bg-stone-900" />
  if (role === 'ADMIN') return <Navigate to="/admin" replace />
  return role === 'HOSPITAL_OWNER' ? <Outlet /> : <Navigate to="/" replace />
}
