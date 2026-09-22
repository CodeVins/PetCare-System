import { NavLink } from 'react-router-dom'

// 예약 ↔ 대기 세그먼트.
// 시안에는 "대기 (1)"처럼 개수가 붙는데, 예약 화면에서 대기 목록을 한 번 더
// 불러와야 해서 뺐다. 대기 화면에서 count를 넘기면 그때만 표시한다.
export default function ReservationTabs({ waitlistCount }) {
  return (
    <div className="segmented mb-4" role="tablist" aria-label="예약과 대기">
      <NavLink
        to="/reservations"
        role="tab"
        className={({ isActive }) =>
          `seg-btn flex items-center justify-center ${isActive ? 'seg-btn-on' : ''}`
        }
      >
        예약
      </NavLink>
      <NavLink
        to="/waitlist"
        role="tab"
        className={({ isActive }) =>
          `seg-btn flex items-center justify-center ${isActive ? 'seg-btn-on' : ''}`
        }
      >
        대기{waitlistCount != null ? ` (${waitlistCount})` : ''}
      </NavLink>
    </div>
  )
}
