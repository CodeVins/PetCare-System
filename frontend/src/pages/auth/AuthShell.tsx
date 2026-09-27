import { CaretLeft, PawPrint } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// 로그인/회원가입 화면들이 location.state로 주고받는 값
export interface AuthLocationState {
  from?: string
  signupSuccess?: boolean
  passwordResetSuccess?: boolean
}

interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
}

// 인증 화면 4종이 쓰는 껍데기 — 카드 없이 stone-50 배경 위에 바로 올라간다.
// 데스크톱에서는 420px로 묶어 가운데 정렬.
export default function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh justify-center bg-stone-50 px-6 pb-8 pt-6 md:items-center md:pt-8">
      {/* React 19: 컴포넌트 안의 <title>은 document head로 올라간다 */}
      <title>{`${title} | 펫케어`}</title>
      <div className="flex w-full max-w-[420px] flex-col gap-7">
        {/* 변경(2026-09-27): 비회원 둘러보기 복귀 링크 추가 — 홈이 공개되면서 로그인 화면이
            막다른 길이 되지 않게 (이전: 인증 화면 밖으로 나가는 링크 없음) */}
        <Link
          to="/"
          className="-ml-2 flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-stone-600 hover:text-brand-600"
        >
          <CaretLeft size={18} />
          둘러보기로 돌아가기
        </Link>
        <div className="flex flex-col items-center gap-2 text-center text-brand-600">
          <PawPrint size={56} />
          <h1 className="text-[36px] leading-tight text-stone-900">{title}</h1>
          {description && <p className="text-[15px] text-stone-600">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
