import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

// 대시보드/통계 페이지가 공유하는 KPI 카드.
interface StatTileProps {
  icon?: Icon
  label: string
  value: ReactNode
  tone?: string
}

export default function StatTile({ icon: IconComponent, label, value, tone = 'text-stone-900' }: StatTileProps) {
  return (
    <div className="admin-card flex items-center gap-4 px-5 py-4">
      {IconComponent && (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <IconComponent size={22} />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-stone-500">{label}</p>
        <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      </div>
    </div>
  )
}
