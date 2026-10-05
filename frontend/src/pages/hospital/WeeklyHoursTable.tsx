import { hhmm, hoursOn, todayOf, WEEK } from '../../lib/openingHours'
import type { WeeklyHour } from '../../types/api'

// 병원 상세 "진료 시간" — 월~일 7줄, 오늘 줄 강조, 등록된 구간이 없는 요일은 휴무
export default function WeeklyHoursTable({ hours }: { hours: WeeklyHour[] }) {
  const today = todayOf()
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">요일별 진료 시간</caption>
      <tbody>
        {WEEK.map(({ day, label }) => {
          const ranges = hoursOn(hours, day)
          const isToday = day === today
          return (
            <tr key={day} className={isToday ? 'font-bold text-brand-700' : 'text-stone-700'}>
              <th scope="row" className="w-14 py-1 text-left font-medium">
                {label}
                {isToday && <span className="sr-only"> (오늘)</span>}
              </th>
              <td className="py-1">
                {ranges.length === 0
                  ? <span className="text-stone-400">휴무</span>
                  : ranges.map((r) => `${hhmm(r.openTime)} ~ ${hhmm(r.closeTime)}`).join(', ')}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
