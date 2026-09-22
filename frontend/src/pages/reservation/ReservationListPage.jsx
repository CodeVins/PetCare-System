import { CalendarCheck } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelReservation, getMyReservationsDetailed } from '../../api/reservationApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import StatusBadge from '../../components/common/StatusBadge'
import { formatSlot, RESERVATION_TYPE_LABEL } from '../../lib/format'
import ReservationTabs from './ReservationTabs'

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED']

// 사용자가 보기 편한 3분류 + 전체. 거절·취소·노쇼는 "지난 예약"으로 묶는다
// (전부 더 이상 손댈 게 없는 상태라 따로 볼 이유가 적어서).
const FILTERS = [
  { value: 'ALL', label: '전체', match: () => true },
  { value: 'PENDING', label: '대기중', match: (s) => s === 'PENDING' },
  { value: 'CONFIRMED', label: '확정', match: (s) => s === 'CONFIRMED' },
  {
    value: 'PAST',
    label: '지난 예약',
    match: (s) => s === 'CANCELLED' || s === 'REJECTED' || s === 'NO_SHOW',
  },
]

export default function ReservationListPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    getMyReservationsDetailed()
      .then(setReservations)
      .catch((err) =>
        setError(err.response?.data?.message || '예약 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (reservationId) => {
    if (!window.confirm('예약을 취소할까요?')) return
    setCancellingId(reservationId)
    try {
      await cancelReservation(reservationId)
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: 'CANCELLED' }
            : reservation,
        ),
      )
    } catch (err) {
      setError(err.response?.data?.message || '예약 취소에 실패했습니다.')
    } finally {
      setCancellingId(null)
    }
  }

  const activeFilter = FILTERS.find((f) => f.value === statusFilter) ?? FILTERS[0]
  const filteredReservations = useMemo(
    () => reservations.filter((r) => activeFilter.match(r.status)),
    [reservations, activeFilter],
  )

  return (
    <div>
      <PageHeader title="예약" />
      <ReservationTabs />

      {!loading && !error && reservations.length > 0 && (
        <div
          role="tablist"
          aria-label="예약 상태 필터"
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0"
        >
          {FILTERS.map((filter) => {
            const count = reservations.filter((r) => filter.match(r.status)).length
            return (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`chip ${statusFilter === filter.value ? 'chip-on' : ''}`}
              >
                {filter.label}
                <span
                  className={
                    statusFilter === filter.value ? 'text-white/80' : 'text-stone-500'
                  }
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-30 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && reservations.length === 0 && (
        <div className="card">
          <EmptyState
            icon={CalendarCheck}
            action={
              <Link to="/hospitals" className="btn btn-primary btn-sm">
                병원 찾아보기
              </Link>
            }
          >
            예약 내역이 없습니다.
          </EmptyState>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && filteredReservations.length === 0 && (
        <div className="card">
          <EmptyState icon={CalendarCheck}>
            {`${activeFilter.label} 예약이 없습니다.`}
          </EmptyState>
        </div>
      )}

      {!loading && !error && filteredReservations.length > 0 && (
        <Reveal
          key={statusFilter}
          className="flex flex-col gap-3 md:grid md:grid-cols-2"
          stagger={0.05}
        >
          {filteredReservations.map((reservation) => (
            <RevealItem key={reservation.id}>
              <article className="card flex h-full flex-col gap-2.5 p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="min-w-0 truncate text-base font-bold">
                    {reservation.hospitalName}
                  </h2>
                  <StatusBadge status={reservation.status} />
                </div>
                <div className="flex items-center gap-1.5">
                  {reservation.type && (
                    <span className="badge badge-neutral h-6 shrink-0 px-2 text-xs">
                      {RESERVATION_TYPE_LABEL[reservation.type] ?? reservation.type}
                    </span>
                  )}
                  <p className="min-w-0 truncate text-sm text-stone-600">
                    {reservation.petName} ·{' '}
                    {reservation.slot ? formatSlot(reservation.slot) : '시간 정보 없음'}
                  </p>
                </div>
                {CANCELLABLE_STATUSES.includes(reservation.status) && (
                  <div className="mt-auto flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCancel(reservation.id)}
                      disabled={cancellingId === reservation.id}
                      className="chip h-11 px-4 font-bold text-red-700 disabled:opacity-50"
                    >
                      예약 취소
                    </button>
                  </div>
                )}
              </article>
            </RevealItem>
          ))}
        </Reveal>
      )}
    </div>
  )
}
