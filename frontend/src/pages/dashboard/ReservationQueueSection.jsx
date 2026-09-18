import { CalendarCheck } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getHospitals, getSlots } from '../../api/hospitalApi'
import {
  confirmReservation,
  getAdminReservations,
  rejectReservation,
} from '../../api/reservationAdminApi'
import Button from '../../components/common/Button'

const STATUS_LABEL = {
  PENDING: '대기중',
  CONFIRMED: '확정',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
}

const STATUS_STYLE = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-brand-50 text-brand-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-stone-100 text-stone-500',
}

const FILTER_OPTIONS = [
  { value: 'PENDING', label: '대기중' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'REJECTED', label: '거절됨' },
  { value: 'CANCELLED', label: '취소됨' },
  { value: '', label: '전체' },
]

function formatSlotTime(slot) {
  const date = new Date(slot.startTime).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const format = (value) =>
    new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${format(slot.startTime)} - ${format(slot.endTime)}`
}

export default function ReservationQueueSection() {
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [reservations, setReservations] = useState([])
  const [slotMap, setSlotMap] = useState({})
  const [hospitalNameBySlot, setHospitalNameBySlot] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([getAdminReservations(statusFilter || undefined), getHospitals()])
      .then(async ([reservationsRes, hospitalsRes]) => {
        // ponytail: same N+1 hospital/slot lookup as the customer reservation
        // list — ReservationResponse has no hospital/time fields to join on.
        const slotsByHospital = await Promise.all(
          hospitalsRes.data.data.map((hospital) =>
            getSlots(hospital.id).then(({ data }) => ({
              hospital,
              slots: data.data.content,
            })),
          ),
        )
        const nextSlotMap = {}
        const nextHospitalNameBySlot = {}
        for (const { hospital, slots } of slotsByHospital) {
          for (const slot of slots) {
            nextSlotMap[slot.id] = slot
            nextHospitalNameBySlot[slot.id] = hospital.name
          }
        }
        setSlotMap(nextSlotMap)
        setHospitalNameBySlot(nextHospitalNameBySlot)
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
      if (action === 'confirm') {
        await confirmReservation(reservationId)
      } else {
        await rejectReservation(reservationId)
      }
      setReservations((prev) => prev.filter((reservation) => reservation.id !== reservationId))
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-700">예약 관리</h2>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && reservations.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-12 text-center">
          <CalendarCheck size={28} className="text-stone-300" />
          <p className="text-sm text-stone-500">해당하는 예약이 없습니다.</p>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="space-y-2">
          {reservations.map((reservation) => {
            const slot = slotMap[reservation.slotId]
            const hospitalName = hospitalNameBySlot[reservation.slotId] || '병원 정보 없음'
            return (
              <div
                key={reservation.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{hospitalName}</p>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {slot ? formatSlotTime(slot) : '시간 정보 없음'}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-500">
                      반려동물 ID: {reservation.petId}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[reservation.status]}`}
                  >
                    {STATUS_LABEL[reservation.status]}
                  </span>
                </div>

                {reservation.status === 'PENDING' && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
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
                      className="flex-1 rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
