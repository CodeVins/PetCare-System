import { CalendarCheck, MapPin } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getHospital, getSlots } from '../../api/hospitalApi'
import { getMyPets } from '../../api/petApi'
import { createReservation } from '../../api/reservationApi'
import Button from '../../components/common/Button'

function formatDateLabel(dateOnly) {
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatTimeRange(startTime, endTime) {
  const format = (value) =>
    new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return `${format(startTime)} - ${format(endTime)}`
}

export default function HospitalDetailPage() {
  const { hospitalId } = useParams()
  const navigate = useNavigate()

  const [hospital, setHospital] = useState(null)
  const [slots, setSlots] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [selectedPetId, setSelectedPetId] = useState('')
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')

  useEffect(() => {
    Promise.all([getHospital(hospitalId), getSlots(hospitalId, 'AVAILABLE'), getMyPets()])
      .then(([hospitalRes, slotsRes, petsRes]) => {
        setHospital(hospitalRes.data.data)
        setSlots(slotsRes.data.data)
        setPets(petsRes.data.data)
        if (petsRes.data.data.length > 0) {
          setSelectedPetId(String(petsRes.data.data[0].id))
        }
      })
      .catch((err) =>
        setError(err.response?.data?.message || '병원 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [hospitalId])

  const slotsByDate = useMemo(() => {
    const groups = new Map()
    for (const slot of slots) {
      const dateKey = slot.startTime.slice(0, 10)
      if (!groups.has(dateKey)) groups.set(dateKey, [])
      groups.get(dateKey).push(slot)
    }
    return Array.from(groups.entries())
  }, [slots])

  const handleReserve = async () => {
    setReserveError('')
    if (!selectedPetId || !selectedSlotId) {
      setReserveError('반려동물과 예약 시간을 선택해주세요.')
      return
    }
    setReserving(true)
    try {
      await createReservation({ petId: Number(selectedPetId), slotId: selectedSlotId })
      navigate('/reservations', { replace: true })
    } catch (err) {
      setReserveError(err.response?.data?.message || '예약에 실패했습니다.')
    } finally {
      setReserving(false)
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">{hospital.name}</h1>
        {hospital.address && (
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-500">
            <MapPin size={14} />
            {hospital.address}
          </p>
        )}
      </div>

      {pets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
          예약하려면 먼저 반려동물을 등록해주세요.{' '}
          <Link to="/pets/new" className="font-medium text-brand-600 hover:text-brand-700">
            반려동물 등록하기
          </Link>
        </div>
      )}

      {pets.length > 0 && (
        <>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-stone-700">반려동물</span>
            <select
              value={selectedPetId}
              onChange={(event) => setSelectedPetId(event.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-stone-700">
              예약 가능 시간
            </span>

            {slotsByDate.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-12 text-center">
                <CalendarCheck size={28} className="text-stone-300" />
                <p className="text-sm text-stone-500">예약 가능한 시간이 없습니다.</p>
              </div>
            )}

            <div className="space-y-4">
              {slotsByDate.map(([dateKey, dateSlots]) => (
                <div key={dateKey}>
                  <p className="mb-2 text-xs font-semibold text-stone-500">
                    {formatDateLabel(dateKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                          selectedSlotId === slot.id
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-stone-200 text-stone-700 hover:border-brand-200'
                        }`}
                      >
                        {formatTimeRange(slot.startTime, slot.endTime)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reserveError && <p className="text-sm text-red-600">{reserveError}</p>}

          <Button
            type="button"
            onClick={handleReserve}
            loading={reserving}
            disabled={slots.length === 0}
            className="w-full"
          >
            예약하기
          </Button>
        </>
      )}
    </div>
  )
}
