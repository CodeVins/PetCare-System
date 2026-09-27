import { NavLink } from 'react-router-dom'

// 병원 목록 ↔ 즐겨찾기 세그먼트 (시안의 전체 / 즐겨찾기 탭)
const TABS = [
  { to: '/hospitals', label: '전체' },
  { to: '/favorites', label: '즐겨찾기' },
]

export default function HospitalTabs() {
  return (
    <div className="segmented mb-3" role="tablist" aria-label="병원 보기">
      {TABS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          role="tab"
          className={({ isActive }) =>
            `seg-btn flex items-center justify-center ${isActive ? 'seg-btn-on' : ''}`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
