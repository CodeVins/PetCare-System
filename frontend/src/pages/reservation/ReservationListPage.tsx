import { CalendarCheck, MagnifyingGlass, PawPrint, Trash } from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BASE_URL, errorMessage } from '../../api/axiosInstance'
import { getOrCreateChatRoom } from '../../api/chatApi'
import { getMyPets } from '../../api/petApi'
import {
  cancelReservation,
  getMyReservationCounts,
  getMyReservations,
  hideCancelledReservations,
  hideReservation,
} from '../../api/reservationApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import { usePagedList } from '../../hooks/usePagedList'
import { useToast } from '../../hooks/useToast'
import RescheduleDialog from './RescheduleDialog'
import ReservationCard from './ReservationCard'
import ReservationTabs from './ReservationTabs'
import type { Pet, Reservation, ReservationView } from '../../types/api'

const VIEWS: { value: ReservationView; label: string; empty: string }[] = [
  { value: 'UPCOMING', label: '다가오는', empty: '다가오는 예약이 없어요.' },
  { value: 'PAST', label: '지난', empty: '지난 예약이 없어요.' },
  { value: 'CANCELLED', label: '취소·거절', empty: '취소되거나 거절된 예약이 없어요.' },
  { value: 'ALL', label: '전체', empty: '예약 내역이 없어요.' },
]

// 변경(2026-10-09): 반려동물별 보기, 다가오는/지난/취소 보기(서버 필터·시간순), 예약 카드 개편(날짜 블록·반려동물 사진),
// 끝난 예약 삭제·취소 예약 한 번에 지우기, 병원 문의·다시 예약·리뷰 쓰기 바로가기 추가
// (이전: 대기중/확정/지난 칩을 불러온 페이지 안에서만 거름, 반려동물 이름이 작은 글씨 한 줄, 취소된 예약을 지울 수 없음)
export default function ReservationListPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [petId, setPetId] = useState<number | null>(null)
  const [view, setView] = useState<ReservationView>('UPCOMING')
  const [counts, setCounts] = useState<Record<ReservationView, number> | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<Reservation | null>(null)
  const toast = useToast()
  const navigate = useNavigate()

  const {
    items: reservations,
    setItems: setReservations,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
  } = usePagedList(
    (page) => getMyReservations(page, { petId, view }),
    `${petId}-${view}`,
    '예약 목록을 불러오지 못했습니다.',
  )

  const reloadCounts = useCallback(() => {
    getMyReservationCounts(petId)
      .then(({ data }) => setCounts(data.data))
      .catch(() => setCounts(null))
  }, [petId])

  useEffect(reloadCounts, [reloadCounts])

  useEffect(() => {
    getMyPets()
      .then(({ data }) => setPets(data.data.content))
      .catch(() => setPets([]))
  }, [])

  // 이 보기에서 빠지는 항목(취소·삭제)은 목록에서 바로 빼고 개수만 다시 받음
  const removeFromList = (reservationId: number) => {
    setReservations((prev) => prev.filter((r) => r.id !== reservationId))
    reloadCounts()
  }

  const handleCancel = async (reservation: Reservation) => {
    if (!window.confirm(`${reservation.hospitalName} 예약을 취소할까요?`)) return
    setBusyId(reservation.id)
    try {
      await cancelReservation(reservation.id)
      if (view === 'ALL') {
        setReservations((prev) =>
          prev.map((r) => (r.id === reservation.id ? { ...r, status: 'CANCELLED' } : r)),
        )
        reloadCounts()
      } else {
        removeFromList(reservation.id)
      }
      toast('예약을 취소했어요.')
    } catch (err) {
      toast(errorMessage(err, '예약 취소에 실패했습니다.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleHide = async (reservation: Reservation) => {
    if (!window.confirm('이 예약을 목록에서 삭제할까요? 병원의 진료 기록에는 남아 있어요.')) return
    setBusyId(reservation.id)
    try {
      await hideReservation(reservation.id)
      removeFromList(reservation.id)
      toast('예약을 삭제했어요.')
    } catch (err) {
      toast(errorMessage(err, '예약을 삭제하지 못했습니다.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleClearCancelled = async () => {
    if (!window.confirm('취소·거절된 예약을 모두 삭제할까요? (모든 반려동물)')) return
    setClearing(true)
    try {
      const { data } = await hideCancelledReservations()
      setReservations((prev) => prev.filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED'))
      reloadCounts()
      toast(`${data.data}건을 삭제했어요.`)
    } catch (err) {
      toast(errorMessage(err, '삭제하지 못했습니다.'), 'error')
    } finally {
      setClearing(false)
    }
  }

  const handleChat = async (reservation: Reservation) => {
    try {
      const { data } = await getOrCreateChatRoom(reservation.hospitalId)
      navigate(`/chats/${data.data.id}`)
    } catch (err) {
      toast(errorMessage(err, '채팅을 시작하지 못했습니다.'), 'error')
    }
  }

  const activeView = VIEWS.find((v) => v.value === view) ?? VIEWS[0]
  const selectedPet = pets.find((pet) => pet.id === petId)

  return (
    <div>
      <title>예약 | 펫케어</title>
      <PageHeader
        title="예약"
        action={
          <Link to="/hospitals" className="btn btn-primary btn-sm">
            <MagnifyingGlass size={18} />
            병원 찾기
          </Link>
        }
      />
      <ReservationTabs />

      {rescheduleTarget && (
        <RescheduleDialog
          key={rescheduleTarget.id}
          reservation={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={(updated) => {
            setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
            toast('예약 시간을 변경했어요. 병원이 확정하면 알려드릴게요.')
          }}
        />
      )}

      {/* 반려동물 고르기 — 둘 이상일 때만 의미가 있음 */}
      {pets.length > 1 && (
        <section aria-label="반려동물 선택" className="mb-4">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0">
            <button
              type="button"
              aria-pressed={petId === null}
              onClick={() => setPetId(null)}
              className={`chip h-12 pl-1.5 pr-4 ${petId === null ? 'chip-soft' : ''}`}
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                <PawPrint size={18} />
              </span>
              모든 아이
            </button>
            {pets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                aria-pressed={petId === pet.id}
                onClick={() => setPetId(pet.id)}
                className={`chip h-12 pl-1.5 pr-4 ${petId === pet.id ? 'chip-soft' : ''}`}
              >
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-stone-100 text-stone-500">
                  {pet.imageUrl ? (
                    <img
                      src={`${BASE_URL}${pet.imageUrl}`}
                      alt=""
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                      className="size-full object-cover"
                    />
                  ) : (
                    <PawPrint size={18} weight="duotone" />
                  )}
                </span>
                {pet.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="예약 보기" className="segmented w-full sm:w-auto">
          {VIEWS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={view === item.value}
              onClick={() => setView(item.value)}
              className={`seg-btn flex items-center justify-center gap-1 whitespace-nowrap px-3 text-sm sm:px-4 ${view === item.value ? 'seg-btn-on' : ''}`}
            >
              {item.label}
              {counts && (
                <span className={view === item.value ? 'text-brand-600' : 'text-stone-400'}>
                  {counts[item.value]}
                </span>
              )}
            </button>
          ))}
        </div>
        {view === 'CANCELLED' && (counts?.CANCELLED ?? 0) > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClearCancelled}
            loading={clearing}
          >
            <Trash size={16} />
            모두 삭제
          </Button>
        )}
      </div>

      {loading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && reservations.length === 0 && (
        <div className="card">
          <EmptyState
            icon={CalendarCheck}
            action={
              view === 'UPCOMING' && (
                <Link to="/hospitals" className="btn btn-primary btn-sm">
                  병원 찾아보기
                </Link>
              )
            }
          >
            {selectedPet ? `${selectedPet.name}의 ${activeView.empty}` : activeView.empty}
          </EmptyState>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <Reveal key={`${petId}-${view}`} className="grid gap-3 md:grid-cols-2" stagger={0.05}>
          {reservations.map((reservation) => (
            <RevealItem key={reservation.id}>
              <ReservationCard
                reservation={reservation}
                busy={busyId === reservation.id}
                onReschedule={() => setRescheduleTarget(reservation)}
                onCancel={() => handleCancel(reservation)}
                onHide={() => handleHide(reservation)}
                onChat={() => handleChat(reservation)}
              />
            </RevealItem>
          ))}
        </Reveal>
      )}

      {!loading && !error && hasMore && (
        <Button
          type="button"
          variant="secondary"
          onClick={loadMore}
          loading={loadingMore}
          className="mt-4 w-full"
        >
          더 보기
        </Button>
      )}
    </div>
  )
}
