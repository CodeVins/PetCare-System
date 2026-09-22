import { CaretLeft } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

// 목록 → 상세/폼으로 들어간 화면의 제목 줄. 시안에서는 별도 56px 헤더에
// 뒤로가기 + 제목이 있는데, 여기서는 공통 헤더/탭바를 그대로 두고 본문 맨 위에
// 같은 구성을 얹는다.
export default function PageHeader({ title, subtitle, back = false, action }) {
  const navigate = useNavigate()

  return (
    <div className="mb-5 flex items-start gap-1 md:mb-6">
      {back && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
          className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-stone-800 transition-colors hover:bg-stone-100 md:-ml-3"
        >
          <CaretLeft size={24} />
        </button>
      )}

      <div className="min-w-0 flex-1 self-center">
        <h1 className="truncate text-[24px] leading-tight md:text-[32px]">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-sm text-stone-600 md:text-[15px]">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="flex shrink-0 items-center gap-2 self-center">{action}</div>}
    </div>
  )
}
