import {
  Bell,
  Buildings,
  CalendarCheck,
  ChatCircleDots,
  Gauge,
  House,
  PawPrint,
  SignOut,
  UserCircle,
} from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout as logoutRequest } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

// DESIGN_SPEC: 탭은 최대 5개. 보호자는 반려동물/병원/예약을, 병원 소유자·관리자는
// 그 자리에 대시보드/채팅/알림을 넣는다 (관리자 메뉴·내 예약은 마이페이지 하위로).
const USER_NAV = [
  { to: '/', label: '홈', icon: House },
  { to: '/pets', label: '반려동물', icon: PawPrint },
  { to: '/hospitals', label: '병원', icon: Buildings },
  { to: '/reservations', label: '예약', icon: CalendarCheck },
  { to: '/mypage', label: '마이페이지', icon: UserCircle },
]

const OWNER_NAV = [
  { to: '/', label: '홈', icon: House },
  { to: '/dashboard', label: '대시보드', icon: Gauge },
  { to: '/chats', label: '채팅', icon: ChatCircleDots },
  { to: '/notifications', label: '알림', icon: Bell },
  { to: '/mypage', label: '마이페이지', icon: UserCircle },
]

const OWNER_ROLES = ['HOSPITAL_OWNER', 'ADMIN']

function UnreadDot({ count }) {
  if (!count) return null
  return (
    <span className="absolute right-0.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Header() {
  const { logout, role } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const navItems = OWNER_ROLES.includes(role) ? OWNER_NAV : USER_NAV

  const handleLogout = async () => {
    try {
      await logoutRequest()
    } catch {
      // refreshToken may already be invalid; clear local session regardless
    }
    logout()
    navigate('/login', { replace: true })
  }

  const iconBtn =
    'relative flex size-11 items-center justify-center rounded-full text-stone-800 transition-colors hover:bg-stone-100'

  return (
    <>
      {/* 헤더: 모바일 56px / 데스크톱 72px */}
      <header className="sticky top-0 z-40 h-14 border-b border-stone-200 bg-white/95 backdrop-blur md:h-18">
        <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between pl-4 pr-2 md:px-6 lg:px-0">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-brand-600 md:w-60"
            aria-label="펫케어 홈"
          >
            <PawPrint size={26} className="md:hidden" />
            <PawPrint size={30} className="hidden md:block" />
            <span className="font-display text-[26px] leading-none md:text-[30px]">
              펫케어
            </span>
          </NavLink>

          {/* 데스크톱 가운데 메뉴 */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="주 메뉴">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative flex h-11 items-center rounded-full px-5 text-base transition-colors ${
                    isActive
                      ? 'font-bold text-brand-600'
                      : 'font-medium text-stone-700 hover:bg-stone-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive &&
                      (reduceMotion ? (
                        <span className="absolute inset-0 rounded-full bg-brand-100" />
                      ) : (
                        <motion.span
                          layoutId="desktop-nav-pill"
                          className="absolute inset-0 rounded-full bg-brand-100"
                          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                        />
                      ))}
                    <span className="relative">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-end md:w-60">
            <NavLink to="/chats" className={iconBtn} aria-label="채팅">
              <ChatCircleDots size={24} />
            </NavLink>

            <NavLink
              to="/notifications"
              className={iconBtn}
              aria-label={
                unreadCount > 0 ? `알림, 안 읽은 알림 ${unreadCount}개` : '알림'
              }
            >
              <Bell size={24} />
              <UnreadDot count={unreadCount} />
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary btn-sm ml-2 hidden md:inline-flex"
            >
              <SignOut size={18} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 하단 탭바 (모바일 전용, 76px) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-[76px] border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="하단 메뉴"
      >
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-brand-600' : 'text-stone-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex h-[30px] w-14 items-center justify-center">
                  {isActive &&
                    (reduceMotion ? (
                      <span className="absolute inset-0 rounded-full bg-brand-100" />
                    ) : (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-full bg-brand-100"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    ))}
                  <Icon size={24} className="relative" />
                </span>
                <span
                  className={`text-xs leading-tight ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
