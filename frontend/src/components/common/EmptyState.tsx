import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: Icon
  children: ReactNode
  action?: ReactNode
}

// DESIGN_SPEC 빈 상태 패턴 — 회색 배경 원 안에 아이콘 + 안내 문구 1줄.
export default function EmptyState({ icon: IconComponent, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      {IconComponent && (
        <span className="flex size-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <IconComponent size={26} />
        </span>
      )}
      <p className="text-[15px] text-stone-600">{children}</p>
      {action}
    </div>
  )
}
