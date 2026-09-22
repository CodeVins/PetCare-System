import { PawPrint } from '@phosphor-icons/react'

// 인증 화면 4종이 쓰는 껍데기 — 카드 없이 stone-50 배경 위에 바로 올라간다.
// 데스크톱에서는 420px로 묶어 가운데 정렬.
export default function AuthShell({ title, description, children }) {
  return (
    <div className="flex min-h-dvh justify-center bg-stone-50 px-6 pb-8 pt-12 md:items-center md:pt-8">
      <div className="flex w-full max-w-[420px] flex-col gap-7">
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
