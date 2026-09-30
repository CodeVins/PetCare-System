import {
  Bell,
  Buildings,
  CalendarCheck,
  ChatText,
  Gauge,
  Heart,
  PawPrint,
  ShieldCheck,
  UserCircle,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout as logoutRequest } from '../../api/authApi'
import { getMyPets } from '../../api/petApi'
import { getMe } from '../../api/userApi'
import Alert from '../../components/common/Alert'
import MenuList from '../../components/common/MenuList'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import type { Role } from '../../types/api'

const ROLE_LABEL: Record<Role, string> = {
  USER: '보호자',
  HOSPITAL_OWNER: '병원 관리자',
  ADMIN: '관리자',
}

const BASE_MENU = [
  { to: '/mypage/reviews', label: '내가 쓴 리뷰', icon: ChatText },
  { to: '/favorites', label: '즐겨찾기한 병원', icon: Heart },
  { to: '/mypage/notifications', label: '알림 설정', icon: Bell },
  { to: '/mypage/account', label: '계정 설정', icon: UserCircle },
]

// DESIGN_SPEC: 병원 소유자·관리자는 하단 탭이 줄어드는 대신
// 병원 관리 / 관리자 / 내 반려동물 / 내 예약이 여기로 내려온다.
// 변경(2026-09-30): 관리 진입점을 역할별로 하나씩 — 병원 소유자는 병원 관리(/dashboard), 관리자는 관리자
// 패널(/admin)만 (이전: 관리자에게 병원 관리 + 관리자 둘 다 보임)
const MY_ACTIVITY_MENU = [
  { to: '/pets', label: '내 반려동물', icon: PawPrint },
  { to: '/hospitals', label: '병원 찾기', icon: Buildings },
  { to: '/reservations', label: '내 예약', icon: CalendarCheck },
]

const OWNER_MENU = [{ to: '/dashboard', label: '병원 관리', icon: Gauge }, ...MY_ACTIVITY_MENU]

const ADMIN_MENU = [{ to: '/admin', label: '관리자 패널', icon: ShieldCheck }, ...MY_ACTIVITY_MENU]

export default function MyPage() {
  const [email, setEmail] = useState('')
  const [petCount, setPetCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const { logout, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.allSettled([getMe(), getMyPets()])
      .then(([meRes, petsRes]) => {
        if (meRes.status === 'fulfilled') setEmail(meRes.value.data.data.email)
        else setLoadError('내 정보를 불러오지 못했습니다.')
        if (petsRes.status === 'fulfilled')
          setPetCount(petsRes.value.data.data.content.length)
      })
      .finally(() => setLoading(false))
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

  const menu = [
    ...(role === 'HOSPITAL_OWNER' ? OWNER_MENU : []),
    ...(role === 'ADMIN' ? ADMIN_MENU : []),
    ...BASE_MENU,
  ]

  const summary = [
    petCount != null && `반려동물 ${petCount}마리`,
    (role && ROLE_LABEL[role]) ?? '보호자',
  ]
    .filter(Boolean)
    .join(' · ')

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="h-22 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-45 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PageHeader title="마이페이지" />

      <Alert tone="error">{loadError}</Alert>

      <section aria-label="내 계정" className="card flex items-center gap-3.5 p-4">
        <span className="icon-badge size-14">
          <UserCircle size={28} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{email}</span>
          <span className="text-[13px] text-stone-600">{summary}</span>
        </span>
      </section>

      <MenuList items={menu} label="내 정보 메뉴" />

      <button type="button" onClick={handleLogout} className="btn btn-secondary mt-2 w-full text-red-700">
        로그아웃
      </button>
    </div>
  )
}
