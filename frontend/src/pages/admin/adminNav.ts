import {
  Buildings,
  CalendarBlank,
  CalendarCheck,
  ChartBar,
  ChatText,
  Flag,
  Gauge,
  Storefront,
  Users,
  type Icon,
} from '@phosphor-icons/react'

export type ConsoleNavItem = { to: string; label: string; icon: Icon; end?: boolean }

// AdminLayout의 사이드바(데스크톱)와 상단 탭(모바일)이 공유하는 메뉴 정의.
// 변경(2026-09-30): "리뷰 신고" 하나를 리뷰 관리(/admin/reviews)·신고 관리(/admin/reports)로 분리
// (이전: /admin/reviews가 신고 목록뿐이라 신고 안 된 리뷰는 관리자가 볼 방법이 없었음)
export const ADMIN_NAV: ConsoleNavItem[] = [
  { to: '/admin', label: '대시보드', icon: Gauge, end: true },
  { to: '/admin/stats', label: '통계', icon: ChartBar },
  { to: '/admin/users', label: '사용자', icon: Users },
  { to: '/admin/hospitals', label: '병원', icon: Buildings },
  { to: '/admin/reservations', label: '예약', icon: CalendarCheck },
  { to: '/admin/reviews', label: '리뷰', icon: ChatText },
  { to: '/admin/reports', label: '신고', icon: Flag },
]

// 병원 소유자 콘솔(/dashboard/*) — 같은 AdminLayout 쉘을 쓰고 메뉴만 다르다
export const OWNER_NAV: ConsoleNavItem[] = [
  { to: '/dashboard', label: '현황', icon: Gauge, end: true },
  { to: '/dashboard/reservations', label: '예약 관리', icon: CalendarCheck },
  { to: '/dashboard/stats', label: '통계', icon: ChartBar },
  { to: '/dashboard/slots', label: '예약 슬롯', icon: CalendarBlank },
  { to: '/dashboard/reviews', label: '리뷰', icon: ChatText },
  { to: '/dashboard/reports', label: '신고', icon: Flag },
  { to: '/dashboard/hospital', label: '병원 정보', icon: Storefront },
]
