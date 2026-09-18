import {
  Bell,
  Buildings,
  CalendarCheck,
  ChatCircleDots,
  Gauge,
  House,
  PawPrint,
  ShieldCheck,
  SignOut,
  UserCircle,
} from '@phosphor-icons/react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout as logoutRequest } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

const BASE_NAV_ITEMS = [
  { to: '/', label: '홈', icon: House },
  { to: '/pets', label: '반려동물', icon: PawPrint },
  { to: '/hospitals', label: '병원', icon: Buildings },
  { to: '/reservations', label: '예약', icon: CalendarCheck },
  { to: '/mypage', label: '마이페이지', icon: UserCircle },
]

const OWNER_NAV_ITEM = { to: '/dashboard', label: '대시보드', icon: Gauge }
const ADMIN_NAV_ITEM = { to: '/admin', label: '관리자', icon: ShieldCheck }
const OWNER_ROLES = ['HOSPITAL_OWNER', 'ADMIN']

export default function Header() {
  const { logout, role } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(OWNER_ROLES.includes(role) ? [OWNER_NAV_ITEM] : []),
    ...(role === 'ADMIN' ? [ADMIN_NAV_ITEM] : []),
  ]

  const handleLogout = async () => {
    try {
      await logoutRequest()
    } catch {
      // refreshToken may already be invalid; clear local session regardless
    }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Desktop / tablet top nav (>= 768px) */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-lg font-semibold text-brand-700"
          >
            <PawPrint weight="fill" size={24} className="text-brand-500" />
            펫케어
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NavLink
              to="/chats"
              className={({ isActive }) =>
                `flex size-10 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
              aria-label="채팅"
            >
              <ChatCircleDots size={20} />
            </NavLink>

            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `relative flex size-10 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
              aria-label={unreadCount > 0 ? `알림 (안읽음 ${unreadCount}개)` : '알림'}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 md:flex"
            >
              <SignOut size={18} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar (<= 767px) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-brand-600' : 'text-stone-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
