import TextField from '../../components/common/TextField'
import { WEEK } from '../../lib/openingHours'
import type { DayOfWeek, RoutinePayload, RoutineRepeat } from '../../types/api'
import { RECORD_TYPES, ROUTINE_TYPES } from './healthRecordTypes'

const REPEATS: { repeat: RoutineRepeat; label: string }[] = [
  { repeat: 'WEEKLY', label: '매주' },
  { repeat: 'BIWEEKLY', label: '격주' },
  { repeat: 'MONTHLY', label: '매월' },
]

// 루틴 입력 칸(종류·이름·시간·요일·기간) — 펫 상세 루틴 탭과 캘린더 "일정 추가" 창이 같이 씀. 저장 버튼은 쓰는 쪽에서
export default function RoutineFormFields({
  value,
  onChange,
}: {
  value: RoutinePayload
  onChange: (next: RoutinePayload) => void
}) {
  const set = <K extends keyof RoutinePayload>(key: K, v: RoutinePayload[K]) => onChange({ ...value, [key]: v })
  const toggleDay = (day: DayOfWeek) =>
    set('daysOfWeek', value.daysOfWeek.includes(day) ? value.daysOfWeek.filter((d) => d !== day) : [...value.daysOfWeek, day])
  // 변경(2026-11-20): 반복 주기(매주/격주/매월) 추가 — 매월은 요일 대신 시작일의 날짜로 반복 (이전: 매주 요일만)
  const monthly = value.repeat === 'MONTHLY'
  const oneTime = !monthly && value.daysOfWeek.length === 0
  const dayOfMonth = Number(value.startDate.slice(8, 10))

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-stone-800">종류</legend>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_TYPES.map((type) => (
            <button key={type} type="button" aria-pressed={value.type === type} onClick={() => set('type', type)} className={`chip ${value.type === type ? 'chip-on' : ''}`}>
              {RECORD_TYPES[type].label}
            </button>
          ))}
        </div>
      </fieldset>

      <TextField
        label="이름"
        value={value.title}
        onChange={(event) => set('title', event.target.value)}
        placeholder={RECORD_TYPES[value.type].placeholder}
        maxLength={50}
        required
      />

      <TextField
        label="시간 (선택)"
        type="time"
        value={value.time ?? ''}
        onChange={(event) => set('time', event.target.value || null)}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-stone-800">반복</legend>
        <div className="flex flex-wrap gap-2">
          {REPEATS.map(({ repeat, label }) => (
            <button key={repeat} type="button" aria-pressed={value.repeat === repeat} onClick={() => set('repeat', repeat)} className={`chip ${value.repeat === repeat ? 'chip-on' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        {monthly ? (
          <p className="text-[13px] text-stone-500">
            {dayOfMonth ? `매월 ${dayOfMonth}일마다 나와요. 그 날짜가 없는 달은 말일에 나와요.` : '시작일을 고르면 매월 그 날짜에 나와요.'}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {WEEK.map(({ day, label }) => (
                <button key={day} type="button" aria-pressed={value.daysOfWeek.includes(day)} onClick={() => toggleDay(day)} className={`chip size-10 justify-center px-0 ${value.daysOfWeek.includes(day) ? 'chip-on' : ''}`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[13px] text-stone-500">
              {oneTime
                ? '요일을 고르지 않으면 그 날짜 하루만 있는 일정이에요.'
                : value.repeat === 'BIWEEKLY'
                  ? '시작일이 있는 주부터 2주마다, 고른 요일에 나와요.'
                  : '고른 요일마다 캘린더에 나와요.'}
            </p>
          </>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={oneTime ? '날짜' : '시작일'}
          type="date"
          value={value.startDate}
          onChange={(event) => set('startDate', event.target.value)}
          required
        />
        {!oneTime && (
          <TextField
            label="종료일 (선택)"
            type="date"
            value={value.endDate ?? ''}
            min={value.startDate}
            onChange={(event) => set('endDate', event.target.value || null)}
          />
        )}
      </div>
    </>
  )
}
