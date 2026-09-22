import { CalendarCheck } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getSlotIndex } from '../../api/reservationApi'
import {
  confirmReservation,
  getAdminReservations,
  noShowReservation,
  rejectReservation,
} from '../../api/reservationAdminApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import { formatSlot, RESERVATION_TYPE_LABEL, reservationPetCaption } from '../../lib/format'

const FILTER_OPTIONS = [
  { value: 'PENDING', label: '대기중' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'REJECTED', label: '거절됨' },
  { value: 'CANCELLED', label: '취소됨' },
  { value: 'NO_SHOW', label: '노쇼' },
  { value: '', label: '전체' },
]

const ACTION_FNS = {
  confirm: confirmReservation,
  reject: rejectReservation,
  noShow: noShowReservation,
}

export default function ReservationQueueSection() {
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [reservations, setReservations] = useState([])
  const [index, setIndex] = useState({ slotMap: {}, hospitalNameBySlot: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    // 슬롯/병원 조인은 예약 화면과 같은 함수 (reservationApi.getSlotIndex)
    Promise.all([getAdminReservations(statusFilter || undefined), getSlotIndex()])
      .then(([reservationsRes, slotIndex]) => {
        setIndex(slotIndex)
        setReservations(reservationsRes.data.data.content)
      })
      .catch((err) =>
        setError(err.response?.data?.message || '예약 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleAction = async (reservationId, action) => {
    setActingId(reservationId)
    try {
      await ACTION_FNS[action](reservationId)
      setReservations((prev) =>
        prev.filter((reservation) => reservation.id !== reservationId),
      )
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 상태 필터는 select 대신 칩 줄로 (모바일에서 가로 스크롤) */}
      <div
        role="tablist"
        aria-label="예약 상태 필터"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0"
      >
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={statusFilter === option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`chip ${statusFilter === option.value ? 'chip-on' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && reservations.length === 0 && (
        <div className="card">
          <EmptyState icon={CalendarCheck}>해당하는 예약이 없습니다.</EmptyState>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          {reservations.map((reservation) => {
            const slot = index.slotMap[reservation.slotId]
            return (
              <article
                key={reservation.id}
                className="card flex h-full flex-col gap-2.5 p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate text-base font-bold">
                    {index.hospitalNameBySlot[reservation.slotId] || '병원 정보 없음'}
                  </h3>
                  <StatusBadge status={reservation.status} />
                </div>
                <p className="text-sm text-stone-600">
                  {slot ? formatSlot(slot) : '시간 정보 없음'}
                </p>
                <div className="flex items-center gap-1.5">
                  {reservation.type && (
                    <span className="badge badge-neutral h-6 shrink-0 px-2 text-xs">
                      {RESERVATION_TYPE_LABEL[reservation.type] ?? reservation.type}
                    </span>
                  )}
                  <p className="min-w-0 truncate text-[13px] font-medium text-stone-700">
                    {reservation.petName
                      ? reservationPetCaption(reservation)
                      : `반려동물 ID ${reservation.petId}`}
                  </p>
                </div>

                {reservation.status === 'PENDING' && (
                  <div className="mt-auto flex gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAction(reservation.id, 'confirm')}
                      loading={actingId === reservation.id}
                      className="flex-1"
                    >
                      확정
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleAction(reservation.id, 'reject')}
                      disabled={actingId === reservation.id}
                      className="btn btn-danger btn-sm flex-1 disabled:opacity-50"
                    >
                      거절
                    </button>
                  </div>
                )}

                {reservation.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => handleAction(reservation.id, 'noShow')}
                    disabled={actingId === reservation.id}
                    className="btn btn-secondary btn-sm mt-auto w-full disabled:opacity-50"
                  >
                    노쇼 처리
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
