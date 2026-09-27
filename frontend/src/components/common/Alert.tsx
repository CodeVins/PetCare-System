import { CheckCircle, Info, WarningCircle, type Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

type Tone = 'ok' | 'error' | 'info'

const TONES: Record<Tone, [string, Icon]> = {
  ok: ['bg-green-100 text-green-800', CheckCircle],
  error: ['bg-red-100 text-red-700', WarningCircle],
  info: ['bg-brand-50 text-brand-700', Info],
}

interface AlertProps {
  tone?: Tone
  children?: ReactNode
  className?: string
}

// 성공/실패 안내 배너. role="alert"은 실패일 때만 — 성공 안내가 포커스를
// 가로채지 않도록 status로 읽힌다.
export default function Alert({ tone = 'info', children, className = '' }: AlertProps) {
  if (!children) return null
  const [style, IconComponent] = TONES[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${style} ${className}`}
    >
      <IconComponent size={20} className="mt-px shrink-0" />
      <span>{children}</span>
    </div>
  )
}
