import { Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../api/axiosInstance'
import { checkRoutine, uncheckRoutine } from '../../api/petApi'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { CalendarEvent } from '../../types/api'
import { RECORD_TYPES } from './healthRecordTypes'

// 체크한 사람: 나면 "내가", 공동보호자면 이메일 앞부분(카카오 자리표시 이메일은 "가족")
function doneByLabel(event: CalendarEvent, myId: number | null) {
  if (!event.done || event.doneByUserId == null) return null
  if (event.doneByUserId === myId) return '내가 완료'
  const local = event.doneByEmail?.split('@')[0] ?? ''
  return `${!local || event.doneByEmail?.endsWith('.invalid') ? '가족' : local}님이 완료`
}

// 루틴 하루치 한 줄 — 체크 버튼(오늘까지만) + 이름 + 체크한 사람. 캘린더 그날 목록과 "오늘 할 일"이 같이 씀
export default function RoutineEventItem({
  event,
  today,
  onChange,
}: {
  event: CalendarEvent
  today: string
  // 체크/해제 성공 후 바뀐 이벤트 — 부모가 목록만 고침(다시 불러오지 않음)
  onChange: (next: CalendarEvent) => void
}) {
  const { userId } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const meta = event.recordType ? RECORD_TYPES[event.recordType] : null
  // 미래 날짜는 체크 불가(서버도 400) — 점선 비활성으로 예정 표시
  const checkable = event.date <= today
  const doneBy = doneByLabel(event, userId)

  const toggle = async () => {
    if (event.routineId == null) return
    setBusy(true)
    try {
      if (event.done) await uncheckRoutine(event.petId, event.routineId, event.date)
      else await checkRoutine(event.petId, event.routineId, event.date)
      onChange({
        ...event,
        done: !event.done,
        doneByUserId: event.done ? null : userId,
        doneByEmail: null,
      })
    } catch (err) {
      toast(errorMessage(err, '처리에 실패했습니다.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <button
        type="button"
        onClick={toggle}
        disabled={!checkable || busy}
        aria-pressed={!!event.done}
        aria-label={`${event.title} ${event.done ? '완료 취소' : '완료'}`}
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-colors disabled:cursor-not-allowed ${
          event.done
            ? 'border-violet-500 bg-violet-500 text-white'
            : checkable
              ? 'border-violet-300 bg-white text-violet-300 hover:border-violet-500'
              : 'border-dashed border-stone-300 bg-stone-50 text-stone-300'
        } ${busy ? 'opacity-60' : ''}`}
      >
        <Check size={20} weight="bold" />
      </button>
      <Link to={`/pets/${event.petId}?tab=routines`} className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-sm font-bold ${event.done ? 'text-stone-500 line-through' : ''}`}>{event.title}</span>
        <span className="text-xs text-stone-500">
          {meta?.label} 루틴{event.time ? ` · ${event.time.slice(0, 5)}` : ''} · {event.petName}
          {doneBy && <span className="text-violet-700"> · {doneBy}</span>}
        </span>
      </Link>
    </div>
  )
}
