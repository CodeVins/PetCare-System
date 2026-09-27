import { CaretDown, CaretUp, MagnifyingGlass, Star } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { getHospitalStats, getStatsSummary } from '../../api/adminApi'
import Alert from '../../components/common/Alert'
import AdminPageHeader from './AdminPageHeader'
import StatTile from './StatTile'

const COLUMNS = [
  { key: 'hospitalName', label: '병원명', align: 'left' },
  { key: 'reservationCount', label: '확정 예약', align: 'right' },
  { key: 'reviewCount', label: '리뷰 수', align: 'right' },
  { key: 'averageRating', label: '평균 평점', align: 'right' },
]

function SortHeader({ column, sortKey, sortDir, onSort }) {
  const active = sortKey === column.key
  return (
    <th
      scope="col"
      className={`admin-th ${column.align === 'right' ? 'text-right' : ''}`}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={`inline-flex items-center gap-1 hover:text-stone-700 ${
          column.align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        {column.label}
        {active &&
          (sortDir === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />)}
      </button>
    </th>
  )
}

export default function AdminStatsPage() {
  const [summary, setSummary] = useState(null)
  const [hospitalStats, setHospitalStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sortKey, setSortKey] = useState('reservationCount')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    Promise.all([getStatsSummary(), getHospitalStats()])
      .then(([summaryRes, hospitalStatsRes]) => {
        setSummary(summaryRes.data.data)
        setHospitalStats(hospitalStatsRes.data.data)
      })
      .catch((err) => setError(err.response?.data?.message || '통계를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const rows = useMemo(() => {
    const filtered = hospitalStats.filter((h) =>
      h.hospitalName.toLowerCase().includes(keyword.trim().toLowerCase()),
    )
    const dir = sortDir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      const av = a[sortKey] ?? -1
      const bv = b[sortKey] ?? -1
      if (typeof av === 'string') return av.localeCompare(bv) * dir
      return (av - bv) * dir
    })
  }, [hospitalStats, keyword, sortKey, sortDir])

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="통계" description="병원별 성과와 전체 예약 현황을 자세히 봅니다" />
        <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="통계" />
        <Alert tone="error">{error}</Alert>
      </div>
    )
  }

  const total = summary.totalReservations || 0
  const rest = Math.max(0, total - summary.confirmedReservations - summary.cancelledReservations - summary.noShowReservations)
  const segments = [
    { label: '확정', value: summary.confirmedReservations, className: 'bg-brand-500' },
    { label: '취소', value: summary.cancelledReservations, className: 'bg-stone-400' },
    { label: '노쇼', value: summary.noShowReservations, className: 'bg-red-500' },
    { label: '대기중 · 거절', value: rest, className: 'bg-amber-400' },
  ]

  return (
    <div>
      <AdminPageHeader title="통계" description="병원별 성과와 전체 예약 현황을 자세히 봅니다" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="전체 사용자" value={summary.totalUsers} />
        <StatTile label="등록된 반려동물" value={summary.totalPets} />
        <StatTile label="등록된 병원" value={summary.totalHospitals} />
        <StatTile label="전체 예약" value={summary.totalReservations} />
      </div>

      <section className="admin-card mt-4 p-5" aria-labelledby="h-breakdown">
        <h2 id="h-breakdown" className="mb-3 text-sm font-bold text-stone-700">
          예약 상태 분포
        </h2>
        {total === 0 ? (
          <p className="text-sm text-stone-500">아직 예약이 없습니다.</p>
        ) : (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
              {segments.map(
                (s) =>
                  s.value > 0 && (
                    <div
                      key={s.label}
                      className={s.className}
                      style={{ width: `${(s.value / total) * 100}%` }}
                    />
                  ),
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
              {segments.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5 text-stone-600">
                  <span className={`size-2.5 rounded-full ${s.className}`} />
                  {s.label} {s.value}건 ({((s.value / total) * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="admin-card mt-4 overflow-hidden" aria-labelledby="h-hospital-table">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="h-hospital-table" className="text-sm font-bold text-stone-700">
            병원별 통계 ({rows.length}곳)
          </h2>
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="병원 이름 검색"
              aria-label="병원 이름 검색"
              className="admin-input w-full pl-9 sm:w-60"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">조건에 맞는 병원이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-stone-50">
                  {COLUMNS.map((column) => (
                    <SortHeader
                      key={column.key}
                      column={column}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((hospital) => (
                  <tr key={hospital.hospitalId} className="hover:bg-stone-50">
                    <td className="admin-td font-medium text-stone-900">
                      {hospital.hospitalName}
                    </td>
                    <td className="admin-td text-right">{hospital.reservationCount}</td>
                    <td className="admin-td text-right">{hospital.reviewCount}</td>
                    <td className="admin-td text-right">
                      {hospital.averageRating != null ? (
                        <span className="inline-flex items-center gap-1 justify-end text-amber-600">
                          <Star weight="fill" size={14} />
                          {hospital.averageRating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-stone-400">리뷰 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
