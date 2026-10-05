import { Plus, X } from '@phosphor-icons/react'
import { useState } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { updateOpeningHours } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import { useToast } from '../../hooks/useToast'
import { hhmm, hoursOn, WEEK } from '../../lib/openingHours'
import type { DayOfWeek, Hospital } from '../../types/api'

const MAX_PER_DAY = 3 // 서버 HospitalService.MAX_HOURS_PER_DAY와 같음

type Range = { open: string; close: string }
type Week = Record<DayOfWeek, Range[]>

function toWeek(hospital: Hospital): Week {
  return Object.fromEntries(
    WEEK.map(({ day }) => [
      day,
      hoursOn(hospital.weeklyHours, day).map((h) => ({ open: hhmm(h.openTime), close: hhmm(h.closeTime) })),
    ]),
  ) as Week
}

interface OpeningHoursEditorProps {
  hospital: Hospital
  onHospitalUpdated: (hospital: Hospital) => void
}

// 요일별 진료 시간 편집 — 구간이 없는 요일은 휴무. 점심시간처럼 하루를 나누면 구간을 추가(요일당 3개).
// 저장은 전체 교체(PUT). 자정을 넘기는 운영은 지원하지 않아서 그런 병원은 위의 "24시간 운영"을 켜도록 안내
export default function OpeningHoursEditor({ hospital, onHospitalUpdated }: OpeningHoursEditorProps) {
  const [week, setWeek] = useState<Week>(() => toWeek(hospital))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const setRanges = (day: DayOfWeek, ranges: Range[]) => setWeek((w) => ({ ...w, [day]: ranges }))

  // 월요일 시간을 화~금에 그대로 복사 — 평일이 같은 병원이 대부분이라
  const copyMondayToWeekdays = () =>
    setWeek((w) => ({
      ...w,
      TUESDAY: [...w.MONDAY],
      WEDNESDAY: [...w.MONDAY],
      THURSDAY: [...w.MONDAY],
      FRIDAY: [...w.MONDAY],
    }))

  const handleSave = async () => {
    setError('')
    const hours = WEEK.flatMap(({ day }) =>
      week[day].map((r) => ({ dayOfWeek: day, openTime: r.open, closeTime: r.close })),
    )
    if (hours.some((h) => !h.openTime || !h.closeTime)) {
      setError('시작·종료 시간을 모두 입력해 주세요.')
      return
    }
    setSaving(true)
    try {
      const { data } = await updateOpeningHours(hospital.id, hours)
      onHospitalUpdated(data.data)
      setWeek(toWeek(data.data))
      toast('진료 시간을 저장했어요.')
    } catch (err) {
      setError(errorMessage(err, '진료 시간 저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-card mt-4 p-5" aria-labelledby="h-opening-hours">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 id="h-opening-hours" className="font-bold">
          요일별 진료 시간
        </h2>
        <button type="button" onClick={copyMondayToWeekdays} className="admin-btn-secondary">
          월요일 시간을 평일에 적용
        </button>
      </div>
      <p className="mb-4 text-sm text-stone-600">
        병원 목록의 &lsquo;지금 진료 중&rsquo; 표시와 필터에 쓰여요. 시간을 넣지 않은 요일은 휴무로 보여요.
        {hospital.is24Hours && ' 지금은 24시간 운영으로 설정돼 있어 항상 진료 중으로 표시돼요.'}
      </p>

      <div className="divide-y divide-stone-100">
        {WEEK.map(({ day, label }) => {
          const ranges = week[day]
          return (
            <div key={day} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
              <span className="w-8 font-medium">{label}</span>
              {ranges.length === 0 && <span className="text-sm text-stone-400">휴무</span>}
              {ranges.map((range, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <input
                    type="time"
                    aria-label={`${label}요일 ${index + 1}번째 시작 시간`}
                    value={range.open}
                    onChange={(e) =>
                      setRanges(day, ranges.map((r, i) => (i === index ? { ...r, open: e.target.value } : r)))
                    }
                    className="input h-9 w-32 px-2 text-sm"
                  />
                  <span className="text-stone-400">~</span>
                  <input
                    type="time"
                    aria-label={`${label}요일 ${index + 1}번째 종료 시간`}
                    value={range.close}
                    onChange={(e) =>
                      setRanges(day, ranges.map((r, i) => (i === index ? { ...r, close: e.target.value } : r)))
                    }
                    className="input h-9 w-32 px-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setRanges(day, ranges.filter((_, i) => i !== index))}
                    aria-label={`${label}요일 ${index + 1}번째 시간 삭제`}
                    className="flex size-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {ranges.length < MAX_PER_DAY && (
                <button
                  type="button"
                  onClick={() =>
                    setRanges(day, [...ranges, ranges.length === 0 ? { open: '09:00', close: '18:00' } : { open: '', close: '' }])
                  }
                  className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                >
                  <Plus size={14} />
                  {ranges.length === 0 ? '진료 시간 추가' : '구간 추가'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Alert tone="error" className="mt-3">
        {error}
      </Alert>
      <button type="button" onClick={handleSave} disabled={saving} className="admin-btn-primary mt-3 h-10 w-full">
        {saving ? '저장 중...' : '진료 시간 저장'}
      </button>
    </section>
  )
}
