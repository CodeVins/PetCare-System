import { CalendarBlank, CalendarCheck, CaretLeft, CaretRight, Check, PawPrint } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../api/axiosInstance'
import { checkRoutine, getCalendarEvents, getMyPets, uncheckRoutine } from '../../api/petApi'
import { useToast } from '../../hooks/useToast'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import type { CalendarEvent, Pet } from '../../types/api'
import { RECORD_TYPES } from './healthRecordTypes'
import PetTabs from './PetTabs'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 종류별 점 색 — 격자 칸과 범례가 같이 씀
const KIND_DOT = {
  RESERVATION: 'bg-brand-600',
  DUE: 'bg-amber-500',
  RECORD: 'bg-sky-500',
  ROUTINE: 'bg-violet-500',
} as const

// 브라우저 현지 날짜를 'YYYY-MM-DD'로 (toISOString은 UTC라 새벽에 하루 밀림)
function isoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// 그 달을 덮는 6주(42일) 격자 — 일요일 시작. 서버 조회 범위도 이 격자 그대로(최대 62일 안)
function monthGrid(month: Date) {
  const start = addDays(month, -month.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

function eventLabel(event: CalendarEvent) {
  if (event.kind === 'RESERVATION') return `병원 예약 ${event.time?.slice(0, 5) ?? ''}`
  if (event.kind === 'DUE') return event.recordType === 'VACCINATION' ? '다음 접종 예정' : '다음 내원 예정'
  const label = event.recordType ? RECORD_TYPES[event.recordType].label : '기록'
  return event.kind === 'ROUTINE' && event.time ? `${label} ${event.time.slice(0, 5)}` : label
}

function eventLink(event: CalendarEvent) {
  if (event.kind === 'RESERVATION') return '/reservations'
  return `/pets/${event.petId}?tab=${event.kind === 'ROUTINE' ? 'routines' : 'records'}`
}

export default function PetCalendarPage() {
  const today = isoDate(new Date())
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(today)
  const [petId, setPetId] = useState<number | undefined>()
  const [pets, setPets] = useState<Pet[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const toast = useToast()
  const [toggling, setToggling] = useState<string | null>(null)

  const days = useMemo(() => monthGrid(month), [month])
  const from = isoDate(days[0])
  const to = isoDate(days[days.length - 1])

  useEffect(() => {
    getMyPets()
      .then(({ data }) => setPets(data.data.content))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    getCalendarEvents(from, to, petId)
      .then(({ data }) => {
        if (ignore) return
        setEvents(data.data)
        setError('')
      })
      .catch((err) => !ignore && setError(errorMessage(err, '일정을 불러오지 못했습니다.')))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [from, to, petId])

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) map.set(event.date, [...(map.get(event.date) ?? []), event])
    return map
  }, [events])
  const selectedEvents = byDate.get(selected) ?? []

  const moveMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next)
    // 선택한 날이 새 달 밖이면 그 달 1일(이번 달이면 오늘)로
    const nextKey = isoDate(next).slice(0, 7)
    if (selected.slice(0, 7) !== nextKey) setSelected(today.slice(0, 7) === nextKey ? today : isoDate(next))
  }

  // 루틴 완료 체크/해제 — 서버엔 건강 기록 생성/삭제. 성공하면 목록만 고침(다시 불러오지 않음)
  const toggleRoutine = async (event: CalendarEvent) => {
    if (event.routineId == null) return
    const key = `${event.routineId}:${event.date}`
    setToggling(key)
    try {
      if (event.done) await uncheckRoutine(event.petId, event.routineId, event.date)
      else await checkRoutine(event.petId, event.routineId, event.date)
      setEvents((prev) =>
        prev.map((e) =>
          e.kind === 'ROUTINE' && e.routineId === event.routineId && e.date === event.date ? { ...e, done: !event.done } : e,
        ),
      )
    } catch (err) {
      toast(errorMessage(err, '처리에 실패했습니다.'), 'error')
    } finally {
      setToggling(null)
    }
  }

  const goToday = () => {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelected(today)
  }

  const [, selMonth, selDay] = selected.split('-').map(Number)

  return (
    <div>
      <title>캘린더 | 펫케어</title>
      <PageHeader title="반려동물" subtitle="예약·기록·접종 예정일을 한눈에 확인하세요" />
      <PetTabs />

      {pets.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="반려동물 선택">
          <button
            type="button"
            aria-pressed={petId === undefined}
            onClick={() => setPetId(undefined)}
            className={`chip ${petId === undefined ? 'chip-on' : ''}`}
          >
            전체
          </button>
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              aria-pressed={petId === pet.id}
              onClick={() => setPetId(pet.id)}
              className={`chip ${petId === pet.id ? 'chip-on' : ''}`}
            >
              {pet.name}
            </button>
          ))}
        </div>
      )}

      <Alert tone="error">{error}</Alert>

      {/* 열 크기를 minmax(0,…)로 고정 — 안 하면 격자 칸 내용 폭만큼 늘어나 모바일에서 금·토 칸이 잘림 */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="card p-3 md:p-4" aria-label="월간 캘린더">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달" className="flex size-11 items-center justify-center rounded-full hover:bg-stone-100">
              <CaretLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" aria-live="polite">
                {month.getFullYear()}년 {month.getMonth() + 1}월
              </h2>
              <button type="button" onClick={goToday} className="chip h-8 px-3 text-[13px]">
                오늘
              </button>
            </div>
            <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달" className="flex size-11 items-center justify-center rounded-full hover:bg-stone-100">
              <CaretRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-stone-500">
            {WEEKDAYS.map((day, i) => (
              <div key={day} className={`py-1.5 ${i === 0 ? 'text-rose-600' : i === 6 ? 'text-sky-700' : ''}`}>
                {day}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-stone-200 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {days.map((day) => {
              const key = isoDate(day)
              const dayEvents = byDate.get(key) ?? []
              const inMonth = day.getMonth() === month.getMonth()
              const isSelected = key === selected
              const kinds = (['RESERVATION', 'DUE', 'RECORD', 'ROUTINE'] as const).filter((kind) =>
                dayEvents.some((e) => e.kind === kind),
              )
              // 루틴은 매일 반복돼서 제목 대신 "루틴 완료/전체"로 한 줄 요약
              const others = dayEvents.filter((e) => e.kind !== 'ROUTINE')
              const routines = dayEvents.filter((e) => e.kind === 'ROUTINE')
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={isSelected}
                  aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일${dayEvents.length ? `, 일정 ${dayEvents.length}개` : ''}`}
                  className={`flex min-h-14 flex-col items-start gap-1 p-1.5 text-left transition-colors md:min-h-24 ${
                    isSelected ? 'bg-brand-50' : inMonth ? 'bg-white hover:bg-stone-50' : 'bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-[13px] ${
                      key === today
                        ? 'bg-brand-600 font-bold text-white'
                        : inMonth
                          ? day.getDay() === 0
                            ? 'text-rose-600'
                            : 'text-stone-800'
                          : 'text-stone-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {/* 모바일은 종류별 점만, 데스크톱은 앞의 2개 제목 + 나머지 개수 */}
                  <span className="flex gap-1 md:hidden" aria-hidden="true">
                    {kinds.map((kind) => (
                      <span key={kind} className={`size-1.5 rounded-full ${KIND_DOT[kind]}`} />
                    ))}
                  </span>
                  <span className="hidden w-full flex-col gap-0.5 md:flex" aria-hidden="true">
                    {others.slice(0, 2).map((event, i) => (
                      <span key={i} className="flex min-w-0 items-center gap-1 text-[11px] leading-tight text-stone-700">
                        <span className={`size-1.5 shrink-0 rounded-full ${KIND_DOT[event.kind]}`} />
                        <span className="truncate">{eventLabel(event)}</span>
                      </span>
                    ))}
                    {others.length > 2 && <span className="text-[11px] text-stone-500">+{others.length - 2}</span>}
                    {routines.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] leading-tight text-violet-700">
                        <span className={`size-1.5 shrink-0 rounded-full ${KIND_DOT.ROUTINE}`} />
                        루틴 {routines.filter((e) => e.done).length}/{routines.length}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600" aria-label="범례">
            <li className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${KIND_DOT.RESERVATION}`} />병원 예약</li>
            <li className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${KIND_DOT.DUE}`} />접종·내원 예정</li>
            <li className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${KIND_DOT.RECORD}`} />건강·생활 기록</li>
            <li className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${KIND_DOT.ROUTINE}`} />루틴</li>
          </ul>
        </section>

        <section className="card p-4 lg:sticky lg:top-22" aria-labelledby="h-day">
          <h2 id="h-day" className="h-section mb-3">
            {selMonth}월 {selDay}일 일정
          </h2>
          {!loading && selectedEvents.length === 0 && (
            <EmptyState
              icon={pets.length === 0 ? PawPrint : CalendarBlank}
              action={
                pets.length === 0 ? (
                  <Link to="/pets/new" className="btn btn-primary btn-sm">반려동물 등록</Link>
                ) : (
                  <Link to="/hospitals" className="btn btn-secondary btn-sm">
                    <CalendarCheck size={18} />
                    병원 예약하기
                  </Link>
                )
              }
            >
              {pets.length === 0 ? '반려동물을 등록하면 일정이 모여요.' : '이날은 일정이 없어요.'}
            </EmptyState>
          )}
          <ul className="flex flex-col gap-2">
            {selectedEvents.map((event, i) => {
              if (event.kind === 'ROUTINE') {
                const meta = event.recordType ? RECORD_TYPES[event.recordType] : null
                const busy = toggling === `${event.routineId}:${event.date}`
                // 미래 날짜는 체크 불가(서버도 400) — 버튼 대신 예정 표시
                const checkable = event.date <= today
                return (
                  <li key={i} className="flex items-center gap-3 rounded-xl p-2">
                    <button
                      type="button"
                      onClick={() => toggleRoutine(event)}
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
                    <Link to={eventLink(event)} className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={`text-sm font-bold ${event.done ? 'text-stone-500 line-through' : ''}`}>
                        {event.title}
                      </span>
                      <span className="text-xs text-stone-500">
                        {meta?.label} 루틴{event.time ? ` · ${event.time.slice(0, 5)}` : ''} · {event.petName}
                      </span>
                    </Link>
                  </li>
                )
              }
              const meta = event.kind === 'RECORD' && event.recordType ? RECORD_TYPES[event.recordType] : null
              const IconComponent = meta?.icon ?? (event.kind === 'RESERVATION' ? CalendarCheck : CalendarBlank)
              const tone =
                meta?.tone ??
                (event.kind === 'RESERVATION' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-800')
              return (
                <li key={i}>
                  <Link
                    to={eventLink(event)}
                    className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-stone-50"
                  >
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                      <IconComponent size={20} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                        {eventLabel(event)}
                        {event.reservationStatus && <StatusBadge status={event.reservationStatus} className="h-5 px-1.5 text-[11px]" />}
                      </span>
                      <span className="truncate text-[13px] text-stone-700">{event.title}</span>
                      <span className="text-xs text-stone-500">
                        {event.petName}
                        {event.kind !== 'RESERVATION' && event.hospitalName && ` · ${event.hospitalName} 작성`}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
