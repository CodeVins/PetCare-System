import { errorMessage } from '../../api/axiosInstance'
import type { Waitlist } from '../../types/api'
import { Bell, HourglassMedium } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyWaitlist, leaveWaitlist } from '../../api/waitlistApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import { useToast } from '../../hooks/useToast'
import { formatDateTime, formatSlot } from '../../lib/format'
import ReservationTabs from './ReservationTabs'

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState<Waitlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leavingId, setLeavingId] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    // 변경(2026-09-27): WaitlistResponse에 병원명/시간/반려동물 이름이 실려 와서 대기 목록만 조회
    // (이전: getMyPets() + getSlotIndex()로 petId/slotId를 클라이언트에서 조인)
    getMyWaitlist()
      .then((res) => setWaitlist(res.data.data.content))
      .catch((err) =>
        setError(errorMessage(err, '대기 목록을 불러오지 못했습니다.')),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleLeave = async (waitlistId: number) => {
    if (!window.confirm('대기 신청을 취소할까요?')) return
    setLeavingId(waitlistId)
    try {
      await leaveWaitlist(waitlistId)
      setWaitlist((prev) => prev.filter((item) => item.id !== waitlistId))
      toast('대기 신청을 취소했어요.')
    } catch (err) {
      // 변경(2026-09-27): 실패를 토스트로 (이전: setError로 대기 목록 전체가 에러 문구로 바뀜)
      toast(errorMessage(err, '취소에 실패했습니다.'), 'error')
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
            // 변경(2026-10-05): 차례를 받은 항목은 "자리 났어요" + 예약 기한 + 예약하러 가기 (이전: 항상 "대기 중")
            const offered = item.offerExpiresAt != null
            return (
              <RevealItem key={item.id}>
                <article
                  className={`card flex h-full flex-col gap-2.5 p-4 md:p-5 ${offered ? 'ring-2 ring-brand-600' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-base font-bold">{item.hospitalName}</h2>
                    {offered ? (
                      <span className="badge bg-brand-600 text-white">자리 났어요</span>
                    ) : (
                      <span className="badge badge-neutral">대기 중</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600">
                    {item.petName} · {formatSlot(item)}
                  </p>
                  {offered && (
                    <p className="text-sm font-medium text-brand-700">
                      {formatDateTime(item.offerExpiresAt!)}까지 예약하지 않으면 다음 대기자에게 넘어가요.
                    </p>
                  )}
                  <div className="mt-auto flex justify-end gap-2">
                    {offered && (
                      <Link to={`/hospitals/${item.hospitalId}`} className="btn btn-primary btn-sm h-11 px-4">
                        예약하러 가기
                      </Link>
                    )}
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
