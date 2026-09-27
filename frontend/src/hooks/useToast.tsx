import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react'
import { createContext, use, useCallback, useRef, useState, type ReactNode } from 'react'

type ToastTone = 'ok' | 'error'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

type ShowToast = (message: string, tone?: ToastTone) => void

const ToastContext = createContext<ShowToast | null>(null)

const DURATION_MS = 3500
// 한꺼번에 여러 개 떠도 화면을 덮지 않게 최근 3개까지만
const MAX_TOASTS = 3

// 저장·삭제·취소처럼 "동작 결과"를 알리는 짧은 안내. 입력값 검증 오류는 해당 칸 옆
// 인라인(Alert/TextField error)으로 두고, 여기는 페이지 어디서든 부르는 결과 알림용.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback<ShowToast>(
    (message, tone = 'ok') => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, message, tone }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext value={show}>
      {children}
      {/* 모바일은 하단 탭바(76px) 위, 데스크톱은 화면 아래 가운데 */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom)+12px)] z-50 flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl bg-stone-900 py-3 pl-4 pr-2 text-[15px] text-white shadow-lg motion-safe:animate-[toast-in_180ms_ease-out]"
          >
            {toast.tone === 'error' ? (
              <WarningCircle size={20} weight="fill" className="mt-px shrink-0 text-red-400" />
            ) : (
              <CheckCircle size={20} weight="fill" className="mt-px shrink-0 text-brand-500" />
            )}
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="알림 닫기"
              className="-my-1 flex size-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast(): ShowToast {
  const show = use(ToastContext)
  if (!show) throw new Error('useToast는 ToastProvider 안에서만 쓸 수 있습니다.')
  return show
}
