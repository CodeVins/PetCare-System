import { Outlet } from 'react-router-dom'
import LoginRequired from '../components/common/LoginRequired'
import { useAuth } from '../hooks/useAuth'

// 변경(2026-09-27): 비회원이면 /login으로 튕기지 않고 Layout 안에서 "회원가입/로그인 후 이용해
// 주세요" 안내를 보여줌 — 홈·병원은 공개로 풀어서 둘러보다 들어오는 경우가 생김
// (이전: <Navigate to="/login" replace />)
export default function PrivateRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <LoginRequired />
}
