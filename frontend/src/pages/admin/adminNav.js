import {
  Buildings,
  CalendarCheck,
  ChartBar,
  Flag,
  Gauge,
  Users,
} from '@phosphor-icons/react'

// AdminLayout의 사이드바(데스크톱)와 상단 탭(모바일)이 공유하는 메뉴 정의.
export const ADMIN_NAV = [
  { to: '/admin', label: '대시보드', icon: Gauge, end: true },
  { to: '/admin/stats', label: '통계', icon: ChartBar },
  { to: '/admin/users', label: '사용자', icon: Users },
  { to: '/admin/hospitals', label: '병원', icon: Buildings },
  { to: '/admin/reservations', label: '예약', icon: CalendarCheck },
  { to: '/admin/reviews', label: '리뷰 신고', icon: Flag },
]
