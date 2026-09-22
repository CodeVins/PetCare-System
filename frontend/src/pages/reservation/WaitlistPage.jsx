import { Bell, HourglassMedium } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyPets } from '../../api/petApi'
import { getSlotIndex } from '../../api/reservationApi'
import { getMyWaitlist, leaveWaitlist } from '../../api/waitlistApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import { formatSlot } from '../../lib/format'
import ReservationTabs from './ReservationTabs'

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState([])
  const [petMap, setPetMap] = useState({})
  const [index, setIndex] = useState({ slotMap: {}, hospitalNameBySlot: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leavingId, setLeavingId] = useState(null)

  useEffect(() => {
    // 슬롯/병원 조인은 예약 화면과 같은 함수를 쓴다 (reservationApi.getSlotIndex)
    Promise.all([getMyWaitlist(), getMyPets(), getSlotIndex()])
      .then(([waitlistRes, petsRes, slotIndex]) => {
        setPetMap(
          Object.fromEntries(petsRes.data.data.content.map((pet) => [pet.id, pet.name])),
        )
        setIndex(slotIndex)
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
    <div>
      <PageHeader title="예약" />
      <ReservationTabs waitlistCount={loading ? undefined : waitlist.length} />

      <div className="mb-4 flex gap-2.5 rounded-xl bg-brand-50 px-4 py-3.5 text-sm text-brand-700">
        <Bell size={20} className="mt-0.5 shrink-0" />
        <span>대기한 시간에 자리가 나면 1순위로 신청한 분께 알림을 보내드려요.</span>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-30 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && waitlist.length === 0 && (
        <div className="card">
          <EmptyState
            icon={HourglassMedium}
            action={
              <Link to="/hospitals" className="btn btn-primary btn-sm">
                병원 찾아보기
              </Link>
            }
          >
            대기 신청한 시간이 없습니다.
          </EmptyState>
        </div>
      )}

      {!loading && !error && waitlist.length > 0 && (
        <Reveal className="flex flex-col gap-3 md:grid md:grid-cols-2" stagger={0.05}>
          {waitlist.map((item) => {
            const slot = index.slotMap[item.slotId]
            return (
              <RevealItem key={item.id}>
                <article className="card flex h-full flex-col gap-2.5 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-base font-bold">
                      {index.hospitalNameBySlot[item.slotId] || '병원 정보 없음'}
                    </h2>
                    <span className="badge badge-neutral">대기 중</span>
                  </div>
                  <p className="text-sm text-stone-600">
                    {petMap[item.petId] || '반려동물 정보 없음'} ·{' '}
                    {slot ? formatSlot(slot) : '시간 정보 없음'}
                  </p>
                  <div className="mt-auto flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleLeave(item.id)}
                      disabled={leavingId === item.id}
                      className="chip h-11 px-4 font-bold text-red-700 disabled:opacity-50"
                    >
                      대기 취소
                    </button>
                  </div>
                </article>
              </RevealItem>
            )
          })}
        </Reveal>
      )}
    </div>
  )
}
