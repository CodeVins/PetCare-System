import { CalendarCheck } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getHospitals, getSlots } from '../../api/hospitalApi'
import { getMyPets } from '../../api/petApi'
import { cancelReservation, getMyReservations } from '../../api/reservationApi'

const STATUS_LABEL = {
  PENDING: '대기중',
  CONFIRMED: '확정',
  CANCELLED: '취소됨',
}

const STATUS_STYLE = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-brand-50 text-brand-700',
  CANCELLED: 'bg-stone-100 text-stone-500',
}

function formatSlot(slot) {
  const format = (value, options) => new Date(value).toLocaleString('ko-KR', options)
  const date = format(slot.startTime, { month: 'long', day: 'numeric', weekday: 'short' })
  const start = format(slot.startTime, { hour: '2-digit', minute: '2-digit' })
  const end = format(slot.endTime, { hour: '2-digit', minute: '2-digit' })
  return `${date} ${start} - ${end}`
}

export default function ReservationListPage() {
  const [reservations, setReservations] = useState([])
  const [petMap, setPetMap] = useState({})
  const [slotMap, setSlotMap] = useState({})
  const [hospitalNameBySlot, setHospitalNameBySlot] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const load = async () => {
    try {
      const [reservationsRes, petsRes, hospitalsRes] = await Promise.all([
        getMyReservations(),
        getMyPets(),
        getHospitals(),
      ])

      setPetMap(Object.fromEntries(petsRes.data.data.map((pet) => [pet.id, pet.name])))

      // ponytail: N+1 slot lookup across hospitals, fine for a handful of hospitals.
      // If hospital count grows, add hospital/time fields to ReservationResponse instead.
      const slotsByHospital = await Promise.all(
        hospitalsRes.data.data.map((hospital) =>
          getSlots(hospital.id).then(({ data }) => ({ hospital, slots: data.data })),
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
      setReservations(reservationsRes.data.data)
    } catch (err) {
      setError(err.response?.data?.message || '예약 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-stone-900">예약</h1>

      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && reservations.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <CalendarCheck size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">예약 내역이 없습니다.</p>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="space-y-3">
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
                      {slot ? formatSlot(slot) : '시간 정보 없음'}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {petMap[reservation.petId] || '반려동물 정보 없음'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[reservation.status]}`}
                  >
                    {STATUS_LABEL[reservation.status]}
                  </span>
                </div>

                {reservation.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(reservation.id)}
                    disabled={cancellingId === reservation.id}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    예약 취소
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
