import { LockKey } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'

interface LoginRequiredProps {
  // 무엇을 하려다 막혔는지 — "예약하기", "마이페이지" 등. 없으면 일반 문구
  feature?: string
  compact?: boolean
}

// 비회원이 로그인 필요 기능(예약·마이페이지·반려동물 등)에 들어왔을 때 보여주는 안내.
// /login으로 강제 이동시키지 않고 이 자리에서 안내한 뒤, 로그인하면 원래 보던 화면으로
// 돌아오도록 현재 경로를 state.from으로 넘긴다.
export default function LoginRequired({ feature, compact = false }: LoginRequiredProps) {
  const location = useLocation()
  const from = location.pathname + location.search

  return (
    <section
      aria-labelledby="login-required-title"
      className={`card flex flex-col items-center gap-4 text-center ${
        compact ? 'p-5' : 'mx-auto max-w-md px-6 py-12'
      }`}
    >
      <span className="icon-badge size-14">
        <LockKey size={28} weight="duotone" />
      </span>
      <div>
        <h2 id="login-required-title" className="text-xl md:text-2xl">
          {feature ? `${feature}는 회원 전용이에요` : '회원 전용 기능이에요'}
        </h2>
        <p className="mt-1.5 text-[15px] text-stone-600">회원가입/로그인 후 이용해 주세요.</p>
      </div>
      <div className="flex w-full max-w-xs gap-2">
        <Link to="/login" state={{ from }} className="btn btn-primary flex-1">
          로그인
        </Link>
        <Link to="/signup" state={{ from }} className="btn btn-secondary flex-1">
          회원가입
        </Link>
      </div>
    </section>
  )
}
