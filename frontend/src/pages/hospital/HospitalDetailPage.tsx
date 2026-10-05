import { Buildings, CalendarCheck, ChatCircleDots, Heart, MapPin, Star } from '@phosphor-icons/react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BASE_URL, errorMessage } from '../../api/axiosInstance'
import { getOrCreateChatRoom } from '../../api/chatApi'
import { getHospital, getSlots } from '../../api/hospitalApi'
import { getMyPets } from '../../api/petApi'
import { createReservation } from '../../api/reservationApi'
import ReservationNoteFields from './ReservationNoteFields'
import WeeklyHoursTable from './WeeklyHoursTable'
import { openStatus } from '../../lib/openingHours'
import { joinWaitlist } from '../../api/waitlistApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import InfoRow from '../../components/common/InfoRow'
import LoginRequired from '../../components/common/LoginRequired'
import PageHeader from '../../components/common/PageHeader'
import SelectField from '../../components/common/SelectField'
import Tabs from '../../components/common/Tabs'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteIds } from '../../hooks/useFavoriteIds'
import { useToast } from '../../hooks/useToast'
import { formatDateLabel, formatTimeRange, RESERVATION_TYPE_LABEL } from '../../lib/format'
import { OWNER_ROLES } from '../../lib/roles'
import type { Hospital, Pet, ReservationType, Slot } from '../../types/api'
import ReviewSection from './ReviewSection'

const RESERVATION_TYPE_OPTIONS = (
  Object.entries(RESERVATION_TYPE_LABEL) as [ReservationType, string][]
).map(([value, label]) => ({ value, label }))

type DetailTab = 'info' | 'booking' | 'reviews'

// 비회원도 들어올 수 있는 화면 — 정보·예약 가능 시간·리뷰는 보여주고, 즐겨찾기·문의·예약·
// 대기 신청처럼 계정이 필요한 동작만 "로그인 후 이용" 안내로 막는다.
export default function HospitalDetailPage() {
  const { hospitalId = '' } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()

  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<DetailTab>('info')
  // 비회원이 회원 기능 버튼(즐겨찾기/문의)을 눌렀을 때 안내를 띄울 기능 이름
  const [gatedFeature, setGatedFeature] = useState('')

  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [selectedPetId, setSelectedPetId] = useState('')
  const [reservationType, setReservationType] = useState<ReservationType | ''>('')
  const [memo, setMemo] = useState('')
  const [healthCheckId, setHealthCheckId] = useState<number | null>(null)
  // 변경(2026-09-27): 예약 요청 진행 상태를 React 19 async transition으로 (이전: reserving useState)
  const [reserving, startReserve] = useTransition()
  const [reserveError, setReserveError] = useState('')

  const { favoriteIds, toggleFavorite } = useFavoriteIds()
  const isFavorite = favoriteIds.has(Number(hospitalId))
  const [chatError, setChatError] = useState('')

  const [waitlistJoiningId, setWaitlistJoiningId] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    // 변경(2026-09-27): 병원·슬롯(공개)과 내 반려동물(회원 전용)을 분리 — 비회원은 공개 데이터만 조회
    // (이전: getHospital/getSlots/getMyPets/getFavorites를 Promise.all로 한 번에 — 하나라도 401이면 화면 전체 실패)
    Promise.all([getHospital(hospitalId), getSlots(hospitalId)])
      .then(([hospitalRes, slotsRes]) => {
        setHospital(hospitalRes.data.data)
        setSlots(slotsRes.data.data.content)
      })
      .catch((err) => setError(errorMessage(err, '병원 정보를 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [hospitalId])

  useEffect(() => {
    if (!isAuthenticated) return
    getMyPets()
      .then(({ data }) => {
        const petList = data.data.content
        setPets(petList)
        if (petList.length > 0) setSelectedPetId(String(petList[0].id))
      })
      .catch(() => {})
  }, [isAuthenticated])

  const handleFavoriteClick = () => {
    if (!isAuthenticated) return setGatedFeature('즐겨찾기')
    toggleFavorite(Number(hospitalId))
  }

  const handleChatClick = async () => {
    if (!isAuthenticated) return setGatedFeature('병원 문의')
    setChatError('')
    try {
      const { data } = await getOrCreateChatRoom(Number(hospitalId))
      navigate(`/chats/${data.data.id}`)
    } catch (err) {
      setChatError(errorMessage(err, '채팅을 시작하지 못했습니다.'))
    }
  }

  const slotsByDate = useMemo(() => {
    const groups = new Map<string, Slot[]>()
    for (const slot of slots) {
      const dateKey = slot.startTime.slice(0, 10)
      const group = groups.get(dateKey) ?? []
      group.push(slot)
      groups.set(dateKey, group)
    }
    return Array.from(groups.entries())
  }, [slots])

  const handleReserve = () => {
    setReserveError('')
    if (!selectedPetId || !selectedSlotId || !reservationType) {
      setReserveError('반려동물, 진료 유형, 예약 시간을 모두 선택해 주세요.')
      return
    }
    startReserve(async () => {
      try {
        // 변경(2026-10-05): 증상 메모·자가 문진 첨부 전달 (이전: 펫·슬롯·진료 유형만)
        await createReservation({
          petId: Number(selectedPetId),
          slotId: selectedSlotId,
          type: reservationType,
          memo: memo.trim() || null,
          healthCheckRecordId: healthCheckId,
        })
        toast('예약을 신청했어요. 병원에서 확정하면 알림으로 알려드릴게요.')
        navigate('/reservations', { replace: true })
      } catch (err) {
        setReserveError(errorMessage(err, '예약에 실패했습니다.'))
      }
    })
  }

  const handleJoinWaitlist = async (slotId: number) => {
    if (!selectedPetId) {
      toast('반려동물을 선택해 주세요.', 'error')
      return
    }
    setWaitlistJoiningId(slotId)
    try {
      await joinWaitlist({ petId: Number(selectedPetId), slotId })
      // 변경(2026-09-27): 대기 신청 결과를 슬롯 아래 문구 대신 토스트로 (이전: waitlistMessage 인라인 텍스트)
      toast('대기 신청했어요. 자리가 나면 알림으로 알려드릴게요.')
    } catch (err) {
      toast(errorMessage(err, '대기 신청에 실패했습니다.'), 'error')
    } finally {
      setWaitlistJoiningId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-44 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    )
  }

  if (error || !hospital) return <Alert tone="error">{error}</Alert>

  const hasAvailableSlot = slots.some((slot) => slot.status === 'AVAILABLE')

  const tabs: { value: DetailTab; label: string }[] = [
    { value: 'info', label: '정보' },
    { value: 'booking', label: '예약' },
    { value: 'reviews', label: `리뷰 ${hospital.reviewCount ?? 0}` },
  ]

  // 날짜별 예약 시간 칩. 비회원에게는 누를 수 없는 표시용으로만 보여준다.
  const slotList =
    slotsByDate.length === 0 ? (
      <div className="card">
        <EmptyState icon={CalendarCheck}>등록된 예약 시간이 없습니다.</EmptyState>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        {slotsByDate.map(([dateKey, dateSlots]) => (
          <div key={dateKey}>
            <p className="mb-2 text-[13px] font-bold text-stone-600">{formatDateLabel(dateKey)}</p>
            <div className="flex flex-wrap gap-2">
              {dateSlots.map((slot) => {
                const label = formatTimeRange(slot.startTime, slot.endTime)
                if (!isAuthenticated) {
                  return (
                    <span
                      key={slot.id}
                      className={`chip cursor-default ${
                        slot.status === 'AVAILABLE' ? '' : 'bg-stone-50 text-stone-400 line-through'
                      }`}
                    >
                      {label}
                    </span>
                  )
                }
                return slot.status === 'AVAILABLE' ? (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={selectedSlotId === slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`chip ${selectedSlotId === slot.id ? 'chip-on' : ''}`}
                  >
                    {label}
                  </button>
                ) : (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleJoinWaitlist(slot.id)}
                    disabled={waitlistJoiningId === slot.id}
                    className="chip border-dashed bg-stone-50 text-stone-500 hover:text-brand-600 disabled:opacity-50"
                  >
                    {label} · 대기
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )

  return (
    <div>
      <title>{`${hospital.name} | 펫케어`}</title>
      <PageHeader back title="병원 상세" />

      {/* 히어로 — 이미지가 없으면 시안처럼 teal 배경에 아이콘 */}
      <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 text-brand-600">
        {hospital.imageUrl ? (
          <img src={`${BASE_URL}${hospital.imageUrl}`} alt="" className="size-full object-cover" />
        ) : (
          <Buildings size={56} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
        <div>
          <section className="mb-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-[26px] leading-snug">{hospital.name}</h2>
              <button
                type="button"
                onClick={handleFavoriteClick}
                aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                aria-pressed={isFavorite}
                className={`-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isFavorite ? 'text-brand-600' : 'text-stone-400 hover:text-brand-600'
                }`}
              >
                <Heart size={24} weight={isFavorite ? 'fill' : 'regular'} />
              </button>
            </div>

            {hospital.averageRating != null && (
              <p className="flex items-center gap-1.5 text-sm">
                <Star weight="fill" size={16} className="text-amber-600" />
                <b>{hospital.averageRating.toFixed(1)}</b>
                <span className="text-stone-600">
                  리뷰 {hospital.reviewCount}개
                  {hospital.distanceKm != null &&
                    ` · 내 위치에서 ${hospital.distanceKm.toFixed(1)}km`}
                </span>
              </p>
            )}

            {hospital.address && (
              <p className="flex items-center gap-1.5 text-sm text-stone-600">
                <MapPin size={18} />
                {hospital.address}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              {/* 변경(2026-10-05): 요일별 진료 시간 기준 진료 중/종료 (이전: 없음) */}
              {openStatus(hospital) === 'open' && (
                <span className="badge h-6 bg-brand-600 px-2.5 text-xs font-bold text-white">진료 중</span>
              )}
              {openStatus(hospital) === 'closed' && (
                <span className="badge badge-neutral h-6 px-2.5 text-xs text-stone-500">진료 종료</span>
              )}
              {hospital.hasParking && (
                <span className="badge badge-neutral h-6 px-2.5 text-xs">주차 가능</span>
              )}
              {hospital.is24Hours && (
                <span className="badge h-6 bg-brand-50 px-2.5 text-xs text-brand-700">24시간</span>
              )}
              {hospital.openingHours && (
                <span className="badge h-6 bg-brand-50 px-2.5 text-xs text-brand-700">
                  {hospital.openingHours}
                </span>
              )}
            </div>

            <button type="button" onClick={handleChatClick} className="btn btn-secondary mt-1 w-full">
              <ChatCircleDots size={20} />
              병원에 문의하기
            </button>
            <Alert tone="error">{chatError}</Alert>
            {gatedFeature && <LoginRequired feature={gatedFeature} compact />}
          </section>

          <Tabs tabs={tabs} value={tab} onChange={setTab} label="병원 정보" layoutId="hospital-tab" />

          {tab === 'info' && (
            <dl className="card m-0 px-4 py-1">
              <InfoRow term="진료과목">{hospital.specialty}</InfoRow>
              {/* 변경(2026-10-05): 요일별 진료 시간 표 + 기존 자유 텍스트는 "운영 안내"로 (이전: 자유 텍스트 "운영시간"만) */}
              {hospital.weeklyHours.length > 0 && (
                <InfoRow term="진료 시간">
                  <WeeklyHoursTable hours={hospital.weeklyHours} />
                </InfoRow>
              )}
              <InfoRow term="운영 안내">{hospital.openingHours}</InfoRow>
              <InfoRow term="평균 진료비">
                {hospital.avgTreatmentPrice != null
                  ? `약 ${hospital.avgTreatmentPrice.toLocaleString()}원`
                  : null}
              </InfoRow>
              <InfoRow term="주차">{hospital.hasParking ? '가능' : '불가'}</InfoRow>
              <InfoRow term="24시간 운영">{hospital.is24Hours ? '예' : '아니요'}</InfoRow>
              {/* 변경(2026-09-27): 전화번호 행 삭제 — HospitalResponse에 phone 필드가 없어 항상 숨겨지던
                  죽은 코드 (TS 전환하면서 타입 에러로 발견. 이전: <InfoRow term="전화번호">{hospital.phone}</InfoRow>) */}
            </dl>
          )}

          {tab === 'booking' && !isAuthenticated && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-sm font-medium text-stone-700">예약 가능한 시간</p>
                {slotList}
              </div>
              <LoginRequired feature="진료 예약" compact />
            </div>
          )}

          {tab === 'booking' && isAuthenticated && (
            <div className="flex flex-col gap-5">
              {pets.length === 0 ? (
                <div className="card">
                  <EmptyState
                    icon={CalendarCheck}
                    action={
                      <Link to="/pets/new" className="btn btn-primary btn-sm">
                        반려동물 등록하기
                      </Link>
                    }
                  >
                    예약하려면 먼저 반려동물을 등록해 주세요.
                  </EmptyState>
                </div>
              ) : (
                <>
                  <SelectField
                    label="어떤 반려동물이 진료를 받나요?"
                    value={selectedPetId}
                    options={pets.map((pet) => ({ value: pet.id, label: pet.name }))}
                    onChange={(event) => setSelectedPetId(event.target.value)}
                  />

                  <SelectField
                    label="진료 유형"
                    value={reservationType}
                    options={[{ value: '', label: '선택해 주세요' }, ...RESERVATION_TYPE_OPTIONS]}
                    onChange={(event) =>
                      setReservationType(event.target.value as ReservationType | '')
                    }
                  />

                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-700">
                      날짜와 시간을 선택해 주세요
                    </p>
                    {slotList}
                  </div>

                  <ReservationNoteFields
                    petId={selectedPetId}
                    memo={memo}
                    onMemoChange={setMemo}
                    healthCheckId={healthCheckId}
                    onHealthCheckChange={setHealthCheckId}
                  />

                  <Alert tone="error">{reserveError}</Alert>

                  <Button
                    type="button"
                    onClick={handleReserve}
                    loading={reserving}
                    disabled={!hasAvailableSlot || !selectedSlotId || !reservationType}
                    className="w-full shadow"
                  >
                    진료 예약하기
                  </Button>
                </>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <ReviewSection
              hospitalId={hospitalId}
              isManager={role !== null && OWNER_ROLES.includes(role)}
              averageRating={hospital.averageRating}
              reviewCount={hospital.reviewCount}
            />
          )}
        </div>

        {/* 데스크톱 우측 340px 예약 요약 — 모바일에서는 예약 탭만 쓴다 */}
        <aside className="card hidden flex-col gap-3 p-5 lg:flex">
          <h2 className="h-section">진료 예약</h2>
          <p className="text-sm text-stone-600">
            {!isAuthenticated
              ? '예약 가능한 시간을 확인하고, 로그인 후 바로 예약할 수 있어요.'
              : hasAvailableSlot
                ? '예약 탭에서 반려동물과 시간을 고르면 바로 예약돼요.'
                : '지금은 예약 가능한 시간이 없어요. 마감된 시간에 대기 신청할 수 있습니다.'}
          </p>
          <button
            type="button"
            onClick={() => setTab('booking')}
            className="btn btn-primary w-full shadow"
          >
            예약 시간 보기
          </button>
        </aside>
      </div>
    </div>
  )
}
