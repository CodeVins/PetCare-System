import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminRoute() {
  const { isAuthenticated, role } = useAuth()

  // 변경(2026-09-27): 관리자 패널은 소비자 Layout 밖이라 비회원은 로그인 화면으로 보냄
  // (이전: PrivateRoute가 먼저 막아줬는데, PrivateRoute가 안내 화면으로 바뀌면서 여기서 직접 처리)
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: '/admin' }} />

  if (role === null) {
    // 관리자 패널로 넘어가는 찰나(role 조회 중)에 소비자 앱 톤의 스켈레톤이
    // 잠깐 비치지 않도록, 어두운 사이드바 배경과 톤을 맞춘다.
    return <div className="min-h-dvh animate-pulse bg-stone-900" />
  }

  return role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}
