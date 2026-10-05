import { CalendarCheck, CalendarX, ChartBar, UserMinus } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getHospitalPeriodStats } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import Alert from '../../components/common/Alert'
import { formatDateLabel, RESERVATION_TYPE_LABEL } from '../../lib/format'
import type { HospitalPeriodStats, ReservationStatus, ReservationType } from '../../types/api'
import AdminPageHeader from '../admin/AdminPageHeader'
import StatTile from '../admin/StatTile'
import { useOwnerHospital } from './OwnerLayout'

const PERIODS = [7, 30, 90] as const
type Period = (typeof PERIODS)[number]

// 차트 색 — dataviz 검증기로 흰 배경 기준 대비·색각 이상 구분 통과(#0d9488 teal-600, #d97706 amber-600).
// 브랜드 #0f766e는 채도가 낮아 회색처럼 읽혀서 한 단계 밝은 teal을 씀
const BOOKED = 'bg-teal-600'
const CANCELLED = 'bg-amber-600'

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: '확정 대기',
  CONFIRMED: '확정·내원',
  REJECTED: '거절',
  CANCELLED: '취소',
  NO_SHOW: '노쇼',
}

const percent = (ratio: number | null) => (ratio == null ? '—' : `${Math.round(ratio * 100)}%`)

export default function OwnerStatsPage() {
  const { hospital } = useOwnerHospital()
  const [days, setDays] = useState<Period>(30)
  const [stats, setStats] = useState<HospitalPeriodStats | null>(null)
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false
    getHospitalPeriodStats(hospital.id, days)
      .then(({ data }) => {
        if (!ignore) {
          setStats(data.data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err, '통계를 불러오지 못했습니다.'))
      })
    return () => {
      ignore = true
    }
  }, [hospital.id, days])

  const loading = stats == null || stats.hospitalId !== hospital.id || stats.daily.length !== days
  const dailyMax = stats ? Math.max(1, ...stats.daily.map((d) => d.booked + d.cancelled)) : 1
  const typeRows = stats
    ? (Object.entries(stats.countByType) as [ReservationType, number][]).sort((a, b) => b[1] - a[1])
    : []
  const typeMax = Math.max(1, ...typeRows.map(([, count]) => count))
  const hoveredDay = stats && hovered != null ? stats.daily[hovered] : null

  return (
    <div>
      <AdminPageHeader
        title="통계"
        description={stats && !loading ? `${formatDateLabel(stats.from)} ~ ${formatDateLabel(stats.to)} 예약 시간 기준` : '최근 예약 현황'}
        action={
          <div role="tablist" aria-label="기간" className="flex gap-1.5">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={days === period}
                onClick={() => {
                  setDays(period)
                  setHovered(null)
                }}
                className={`admin-btn ${
                  days === period
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {period}일
              </button>
            ))}
          </div>
        }
      />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={CalendarCheck} label="전체 예약" value={loading ? '—' : `${stats.totalReservations}건`} />
        <StatTile
          icon={UserMinus}
          label="노쇼율"
          value={loading ? '—' : percent(stats.noShowRate)}
          tone={!loading && (stats.noShowRate ?? 0) >= 0.1 ? 'text-red-700' : undefined}
        />
        <StatTile icon={CalendarX} label="취소율" value={loading ? '—' : percent(stats.cancelRate)} />
        <StatTile
          icon={ChartBar}
          label={loading ? '슬롯 이용률' : `슬롯 이용률 · ${stats.reservedSlotCount}/${stats.slotCount}`}
          value={loading ? '—' : percent(stats.slotCount ? stats.reservedSlotCount / stats.slotCount : null)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="admin-card p-5" aria-labelledby="h-daily">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="h-daily" className="font-bold">일별 예약</h2>
            <ul className="flex gap-4 text-xs text-stone-600" aria-label="범례">
              <li className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-sm ${BOOKED}`} aria-hidden="true" />
                예약(대기·확정·노쇼)
              </li>
              <li className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-sm ${CANCELLED}`} aria-hidden="true" />
                취소·거절
              </li>
            </ul>
          </div>

          {loading ? (
            <div className="h-48 animate-pulse rounded-lg bg-stone-100" />
          ) : (
            <>
              <div className="relative">
                {hoveredDay && hovered != null && (
                  <div
                    role="status"
                    className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow"
                    style={{ left: `${((hovered + 0.5) / stats.daily.length) * 100}%` }}
                  >
                    {formatDateLabel(hoveredDay.date)} · 예약 {hoveredDay.booked} · 취소·거절 {hoveredDay.cancelled}
                  </div>
                )}
                <div className="flex h-48 items-end border-b border-stone-200" aria-hidden="true">
                  {stats.daily.map((day, index) => {
                    const total = day.booked + day.cancelled
                    return (
                      // 막대보다 넓은 히트 영역 — 열 전체가 hover 대상
                      <div
                        key={day.date}
                        onMouseEnter={() => setHovered(index)}
                        onMouseLeave={() => setHovered(null)}
                        className={`flex h-full flex-1 flex-col justify-end px-px ${
                          hovered === index ? 'bg-stone-100' : ''
                        }`}
                      >
                        {total > 0 && (
                          <div
                            className="flex flex-col gap-0.5 overflow-hidden rounded-t"
                            style={{ height: `${(total / dailyMax) * 100}%` }}
                          >
                            {day.cancelled > 0 && <div className={CANCELLED} style={{ flexGrow: day.cancelled }} />}
                            {day.booked > 0 && <div className={BOOKED} style={{ flexGrow: day.booked }} />}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-stone-500" aria-hidden="true">
                  <span>{formatDateLabel(stats.from)}</span>
                  <span>최대 하루 {dailyMax}건</span>
                  <span>{formatDateLabel(stats.to)}</span>
                </div>
              </div>

              {/* 화면 낭독기·표로 보기용 — 차트 막대는 aria-hidden */}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-stone-600">표로 보기</summary>
                <table className="mt-2 w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-stone-50">
                      <th scope="col" className="admin-th">날짜</th>
                      <th scope="col" className="admin-th text-right">예약</th>
                      <th scope="col" className="admin-th text-right">취소·거절</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {stats.daily
                      .filter((day) => day.booked + day.cancelled > 0)
                      .map((day) => (
                        <tr key={day.date}>
                          <td className="admin-td">{formatDateLabel(day.date)}</td>
                          <td className="admin-td text-right">{day.booked}</td>
                          <td className="admin-td text-right">{day.cancelled}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="admin-card p-5" aria-labelledby="h-status">
            <h2 id="h-status" className="mb-3 font-bold">상태별</h2>
            {loading ? (
              <div className="h-32 animate-pulse rounded-lg bg-stone-100" />
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {(Object.keys(STATUS_LABEL) as ReservationStatus[]).map((status) => (
                  <div key={status} className="flex justify-between border-b border-stone-100 pb-1.5">
                    <dt className="text-stone-600">{STATUS_LABEL[status]}</dt>
                    <dd className="font-bold">{stats.countByStatus[status] ?? 0}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="admin-card p-5" aria-labelledby="h-type">
            <h2 id="h-type" className="mb-3 font-bold">진료 유형별</h2>
            {loading ? (
              <div className="h-32 animate-pulse rounded-lg bg-stone-100" />
            ) : typeRows.length === 0 ? (
              <p className="text-sm text-stone-500">이 기간에 예약이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {typeRows.map(([type, count]) => (
                  <li key={type} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-sm">
                    <span className="truncate text-stone-600">{RESERVATION_TYPE_LABEL[type] ?? type}</span>
                    <span className="h-2.5 overflow-hidden rounded-r bg-stone-100">
                      <span
                        className={`block h-full rounded-r ${BOOKED}`}
                        style={{ width: `${(count / typeMax) * 100}%` }}
                      />
                    </span>
                    <span className="text-right font-bold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
