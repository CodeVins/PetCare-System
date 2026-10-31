import { NavLink } from 'react-router-dom'

// 반려동물 목록 ↔ 캘린더 세그먼트 (병원의 전체 / 즐겨찾기 탭과 같은 모양)
const TABS = [
  { to: '/pets', label: '내 아이들' },
  { to: '/pets/calendar', label: '캘린더' },
]

export default function PetTabs() {
  return (
    <div className="segmented mb-5" role="tablist" aria-label="반려동물 보기">
      {TABS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
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
