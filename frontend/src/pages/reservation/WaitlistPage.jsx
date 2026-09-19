import { HourglassMedium } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getHospitals, getSlots } from '../../api/hospitalApi'
import { getMyPets } from '../../api/petApi'
import { getMyWaitlist, leaveWaitlist } from '../../api/waitlistApi'

function formatSlot(slot) {
  const date = new Date(slot.startTime).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const format = (value) =>
    new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${format(slot.startTime)} - ${format(slot.endTime)}`
}

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState([])
  const [petMap, setPetMap] = useState({})
  const [slotMap, setSlotMap] = useState({})
  const [hospitalNameBySlot, setHospitalNameBySlot] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leavingId, setLeavingId] = useState(null)

  useEffect(() => {
    Promise.all([getMyWaitlist(), getMyPets(), getHospitals()])
      .then(async ([waitlistRes, petsRes, hospitalsRes]) => {
        setPetMap(
          Object.fromEntries(petsRes.data.data.content.map((pet) => [pet.id, pet.name])),
        )

        // ponytail: same N+1 hospital/slot lookup used for reservations —
        // WaitlistResponse has no hospital/time fields to join on either.
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
        setWaitlist(waitlistRes.data.data.content)
      })
      .catch((err) =>
        setError(err.response?.data?.message || '대기 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleLeave = async (waitlistId) => {
    if (!window.confirm('대기 신청을 취소할까요?')) return
    setLeavingId(waitlistId)
    try {
      await leaveWaitlist(waitlistId)
      setWaitlist((prev) => prev.filter((item) => item.id !== waitlistId))
    } catch (err) {
      setError(err.response?.data?.message || '취소에 실패했습니다.')
    } finally {
      setLeavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">대기 목록</h1>

      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && waitlist.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <HourglassMedium size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">대기 신청한 시간이 없습니다.</p>
        </div>
      )}

      {!loading && !error && waitlist.length > 0 && (
        <div className="space-y-3">
          {waitlist.map((item) => {
            const slot = slotMap[item.slotId]
            const hospitalName = hospitalNameBySlot[item.slotId] || '병원 정보 없음'
            return (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="font-medium text-stone-900">{hospitalName}</p>
                <p className="mt-0.5 text-sm text-stone-500">
                  {slot ? formatSlot(slot) : '시간 정보 없음'}
                </p>
                <p className="mt-0.5 text-sm text-stone-500">
                  {petMap[item.petId] || '반려동물 정보 없음'}
                </p>
                <button
                  type="button"
                  onClick={() => handleLeave(item.id)}
                  disabled={leavingId === item.id}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  대기 취소
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
