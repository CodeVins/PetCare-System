import type { DayOfWeek, Hospital, WeeklyHour } from '../types/api'

// Date.getDay()는 일요일=0 — 서버(java DayOfWeek) 이름으로 바꿀 때 씀
const BY_JS_DAY: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export const WEEK: { day: DayOfWeek; label: string }[] = [
  { day: 'MONDAY', label: '월' },
  { day: 'TUESDAY', label: '화' },
  { day: 'WEDNESDAY', label: '수' },
  { day: 'THURSDAY', label: '목' },
  { day: 'FRIDAY', label: '금' },
  { day: 'SATURDAY', label: '토' },
  { day: 'SUNDAY', label: '일' },
]

export const todayOf = (now = new Date()): DayOfWeek => BY_JS_DAY[now.getDay()]

// 'HH:mm:ss' → 'HH:mm'
export const hhmm = (time: string) => time.slice(0, 5)

export const hoursOn = (hours: WeeklyHour[], day: DayOfWeek) =>
  hours.filter((hour) => hour.dayOfWeek === day)

// 서버 Hospital.isOpenAt과 같은 규칙: 24시간이면 open, 진료 시간 미등록이면 null(알 수 없음),
// 그 외엔 오늘 구간 중 [open, close)에 지금이 들어가는지. 상세 응답이 캐시(10분)돼서 화면에서 현재 시각으로 계산함
export function openStatus(
  hospital: Pick<Hospital, 'is24Hours' | 'weeklyHours'>,
  now = new Date(),
): 'open' | 'closed' | null {
  if (hospital.is24Hours) return 'open'
  if (!hospital.weeklyHours?.length) return null
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  const open = hoursOn(hospital.weeklyHours, todayOf(now)).some(
    (hour) => hour.openTime <= time && time < hour.closeTime,
  )
  return open ? 'open' : 'closed'
}
