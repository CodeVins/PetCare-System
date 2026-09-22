import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminRoute() {
  const { role } = useAuth()

  if (role === null) {
    // 관리자 패널로 넘어가는 찰나(role 조회 중)에 소비자 앱 톤의 스켈레톤이
    // 잠깐 비치지 않도록, 어두운 사이드바 배경과 톤을 맞춘다.
    return <div className="min-h-dvh animate-pulse bg-stone-900" />
  }

  return role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}
