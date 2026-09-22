import { House, PawPrint, SignOut } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout as logoutRequest } from '../../api/authApi'
import { getMe } from '../../api/userApi'
import { useAuth } from '../../hooks/useAuth'
import { ADMIN_NAV } from './adminNav'

// 소비자 앱(Header/Layout)과는 완전히 분리된 관리자 전용 쉘 — 하단 탭바 대신
// 사이드바(데스크톱)/상단 스크롤 탭(모바일), stone-900 어두운 톤으로 "관리 도구"
// 느낌을 준다. /admin/* 전체가 이 레이아웃 아래에서 렌더된다.
export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    getMe()
      .then(({ data }) => setEmail(data.data.email))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await logoutRequest()
    } catch {
      // refreshToken may already be invalid; clear local session regardless
    }
    logout()
    navigate('/login', { replace: true })
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-stone-800 text-white'
        : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-100'
    }`

  return (
    <div className="min-h-dvh bg-stone-100 lg:flex">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-64 shrink-0 flex-col bg-stone-900 lg:flex">
        <div className="flex items-center gap-2 px-5 py-5 text-white">
          <PawPrint size={26} className="text-brand-500" />
          <div className="leading-tight">
            <p className="text-base font-bold">펫케어</p>
            <p className="text-xs font-medium text-stone-400">관리자 패널</p>
          </div>
        </div>

        <nav aria-label="관리자 메뉴" className="flex flex-1 flex-col gap-1 px-3">
          {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-800 p-3">
          <NavLink to="/" className={navLinkClass}>
            <House size={20} />
            일반 화면으로
          </NavLink>
          <div className="mt-2 flex items-center justify-between gap-2 px-3 py-1">
            <span className="min-w-0 truncate text-xs text-stone-500">{email}</span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="로그아웃"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* 모바일 상단 바 */}
      <div className="sticky top-0 z-40 bg-stone-900 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <PawPrint size={22} className="text-brand-500" />
            <span className="text-sm font-bold">관리자 패널</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              aria-label="일반 화면으로"
              className="flex size-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white"
            >
              <House size={18} />
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="로그아웃"
              className="flex size-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
        <nav
          aria-label="관리자 메뉴"
          className="flex gap-1 overflow-x-auto border-t border-stone-800 px-3 py-2 no-scrollbar"
        >
          {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                  isActive ? 'bg-stone-800 text-white' : 'text-stone-400'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-[1200px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
