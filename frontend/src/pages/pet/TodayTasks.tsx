import { CalendarCheck, CaretRight } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCalendarEvents } from '../../api/petApi'
import StatusBadge from '../../components/common/StatusBadge'
import type { CalendarEvent } from '../../types/api'
import RoutineEventItem from './RoutineEventItem'

const localToday = () => new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD (로컬 날짜)

// 반려동물 화면 맨 위 "오늘 할 일" — 오늘 루틴(바로 체크)과 병원 예약. 캘린더 API를 오늘 하루로 재사용,
// 오늘 할 일이 없으면 구역 자체를 안 그림
export default function TodayTasks() {
  const today = localToday()
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    getCalendarEvents(today, today)
      .then(({ data }) => setEvents(data.data.filter((e) => e.kind === 'ROUTINE' || e.kind === 'RESERVATION')))
      .catch(() => {})
  }, [today])

  if (events.length === 0) return null
  const routines = events.filter((e) => e.kind === 'ROUTINE')
  const doneCount = routines.filter((e) => e.done).length

  return (
    <section className="card mb-6 p-4 md:p-5" aria-labelledby="h-today">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id="h-today" className="h-section">
          오늘 할 일
          {routines.length > 0 && (
            <span className="ml-1.5 text-violet-700">
              {doneCount}/{routines.length}
            </span>
          )}
        </h2>
        <Link to="/pets/calendar" className="flex min-h-11 items-center gap-0.5 text-sm font-medium text-brand-700">
          캘린더
          <CaretRight size={16} />
        </Link>
      </div>
      <ul className="flex flex-col gap-1">
        {events.map((event, i) =>
          event.kind === 'ROUTINE' ? (
            <li key={i}>
              <RoutineEventItem
                event={event}
                today={today}
                onChange={(next) =>
                  setEvents((prev) => prev.map((e) => (e.kind === 'ROUTINE' && e.routineId === next.routineId ? next : e)))
                }
              />
            </li>
          ) : (
            <li key={i}>
              <Link to="/reservations" className="flex items-center gap-3 rounded-xl p-2 hover:bg-stone-50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <CalendarCheck size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                    병원 예약 {event.time?.slice(0, 5)}
                    {event.reservationStatus && <StatusBadge status={event.reservationStatus} className="h-5 px-1.5 text-[11px]" />}
                  </span>
                  <span className="truncate text-xs text-stone-500">
                    {event.title} · {event.petName}
                  </span>
                </span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
