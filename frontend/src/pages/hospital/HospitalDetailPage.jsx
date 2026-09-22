import {
  Buildings,
  CalendarCheck,
  ChatCircleDots,
  Heart,
  MapPin,
  Star,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import { getOrCreateChatRoom } from '../../api/chatApi'
import {
  addFavorite,
  getFavorites,
  getHospital,
  getSlots,
  removeFavorite,
} from '../../api/hospitalApi'
import { getMyPets } from '../../api/petApi'
import { createReservation } from '../../api/reservationApi'
import { joinWaitlist } from '../../api/waitlistApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import InfoRow from '../../components/common/InfoRow'
import PageHeader from '../../components/common/PageHeader'
import SelectField from '../../components/common/SelectField'
import Tabs from '../../components/common/Tabs'
import { useAuth } from '../../hooks/useAuth'
import { formatDateLabel, formatTimeRange, RESERVATION_TYPE_LABEL } from '../../lib/format'
import ReviewSection from './ReviewSection'

const MANAGER_ROLES = ['HOSPITAL_OWNER', 'ADMIN']

const RESERVATION_TYPE_OPTIONS = Object.entries(RESERVATION_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
)

export default function HospitalDetailPage() {
  const { hospitalId } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()

  const [hospital, setHospital] = useState(null)
  const [slots, setSlots] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('info')

  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [selectedPetId, setSelectedPetId] = useState('')
  const [reservationType, setReservationType] = useState('')
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')

  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteSaving, setFavoriteSaving] = useState(false)
  const [chatError, setChatError] = useState('')

  const [waitlistJoiningId, setWaitlistJoiningId] = useState(null)
  const [waitlistMessage, setWaitlistMessage] = useState('')

  useEffect(() => {
    Promise.all([getHospital(hospitalId), getSlots(hospitalId), getMyPets(), getFavorites()])
      .then(([hospitalRes, slotsRes, petsRes, favoritesRes]) => {
        setHospital(hospitalRes.data.data)
        setSlots(slotsRes.data.data.content)
        const petList = petsRes.data.data.content
        setPets(petList)
        if (petList.length > 0) setSelectedPetId(String(petList[0].id))
        setIsFavorite(
          favoritesRes.data.data.content.some((h) => h.id === Number(hospitalId)),
        )
      })
      .catch((err) =>
        setError(err.response?.data?.message || '병원 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [hospitalId])

  const toggleFavorite = async () => {
    const next = !isFavorite
    setIsFavorite(next)
    setFavoriteSaving(true)
    try {
      if (next) await addFavorite(hospitalId)
      else await removeFavorite(hospitalId)
    } catch {
      setIsFavorite(!next)
    } finally {
      setFavoriteSaving(false)
    }
  }

  const handleChatClick = async () => {
    setChatError('')
    try {
      const { data } = await getOrCreateChatRoom(Number(hospitalId))
      navigate(`/chats/${data.data.id}`)
    } catch (err) {
      setChatError(err.response?.data?.message || '채팅을 시작하지 못했습니다.')
    }
  }

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
    if (!selectedPetId || !selectedSlotId || !reservationType) {
      setReserveError('반려동물, 진료 유형, 예약 시간을 모두 선택해 주세요.')
      return
    }
    setReserving(true)
    try {
      await createReservation({
        petId: Number(selectedPetId),
        slotId: selectedSlotId,
        type: reservationType,
      })
      navigate('/reservations', { replace: true })
    } catch (err) {
      setReserveError(err.response?.data?.message || '예약에 실패했습니다.')
    } finally {
      setReserving(false)
    }
  }

  const handleJoinWaitlist = async (slotId) => {
    setWaitlistMessage('')
    if (!selectedPetId) {
      setWaitlistMessage('반려동물을 선택해 주세요.')
      return
    }
    setWaitlistJoiningId(slotId)
    try {
      await joinWaitlist({ petId: Number(selectedPetId), slotId })
      setWaitlistMessage('대기 신청이 완료되었습니다. 자리가 나면 알림으로 알려드려요.')
    } catch (err) {
      setWaitlistMessage(err.response?.data?.message || '대기 신청에 실패했습니다.')
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

  if (error) return <Alert tone="error">{error}</Alert>

  const hasAvailableSlot = slots.some((slot) => slot.status === 'AVAILABLE')

  const tabs = [
    { value: 'info', label: '정보' },
    { value: 'booking', label: '예약' },
    { value: 'reviews', label: `리뷰 ${hospital.reviewCount ?? 0}` },
  ]

  return (
    <div>
      <PageHeader back title="병원 상세" />

      {/* 히어로 — 이미지가 없으면 시안처럼 teal 배경에 아이콘 */}
      <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 text-brand-600">
        {hospital.imageUrl ? (
          <img
            src={`${BASE_URL}${hospital.imageUrl}`}
            alt=""
            className="size-full object-cover"
          />
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
                onClick={toggleFavorite}
                disabled={favoriteSaving}
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
              {hospital.hasParking && (
                <span className="badge badge-neutral h-6 px-2.5 text-xs">주차 가능</span>
              )}
              {hospital.is24Hours && (
                <span className="badge h-6 bg-brand-50 px-2.5 text-xs text-brand-700">
                  24시간
                </span>
              )}
              {hospital.openingHours && (
                <span className="badge h-6 bg-brand-50 px-2.5 text-xs text-brand-700">
                  {hospital.openingHours}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleChatClick}
              className="btn btn-secondary mt-1 w-full"
            >
              <ChatCircleDots size={20} />
              병원에 문의하기
            </button>
            <Alert tone="error">{chatError}</Alert>
          </section>

          <Tabs
            tabs={tabs}
            value={tab}
            onChange={setTab}
            label="병원 정보"
            layoutId="hospital-tab"
          />

          {tab === 'info' && (
            <dl className="card m-0 px-4 py-1">
              <InfoRow term="진료과목">{hospital.specialty}</InfoRow>
              <InfoRow term="운영시간">{hospital.openingHours}</InfoRow>
              <InfoRow term="평균 진료비">
                {hospital.avgTreatmentPrice != null
                  ? `약 ${hospital.avgTreatmentPrice.toLocaleString()}원`
                  : null}
              </InfoRow>
              <InfoRow term="주차">{hospital.hasParking ? '가능' : '불가'}</InfoRow>
              <InfoRow term="24시간 운영">{hospital.is24Hours ? '예' : '아니요'}</InfoRow>
              <InfoRow term="전화번호">{hospital.phone}</InfoRow>
            </dl>
          )}

          {tab === 'booking' && (
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
                    onChange={(event) => setReservationType(event.target.value)}
                  />

                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-700">
                      날짜와 시간을 선택해 주세요
                    </p>

                    {slotsByDate.length === 0 ? (
                      <div className="card">
                        <EmptyState icon={CalendarCheck}>
                          등록된 예약 시간이 없습니다.
                        </EmptyState>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {slotsByDate.map(([dateKey, dateSlots]) => (
                          <div key={dateKey}>
                            <p className="mb-2 text-[13px] font-bold text-stone-600">
                              {formatDateLabel(dateKey)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {dateSlots.map((slot) =>
                                slot.status === 'AVAILABLE' ? (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    aria-pressed={selectedSlotId === slot.id}
                                    onClick={() => setSelectedSlotId(slot.id)}
                                    className={`chip ${
                                      selectedSlotId === slot.id ? 'chip-on' : ''
                                    }`}
                                  >
                                    {formatTimeRange(slot.startTime, slot.endTime)}
                                  </button>
                                ) : (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => handleJoinWaitlist(slot.id)}
                                    disabled={waitlistJoiningId === slot.id}
                                    className="chip border-dashed bg-stone-50 text-stone-500 hover:text-brand-600 disabled:opacity-50"
                                  >
                                    {formatTimeRange(slot.startTime, slot.endTime)} · 대기
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {waitlistMessage && (
                      <p className="mt-2 text-sm text-stone-600">{waitlistMessage}</p>
                    )}
                  </div>

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
              isManager={MANAGER_ROLES.includes(role)}
              averageRating={hospital.averageRating}
              reviewCount={hospital.reviewCount}
            />
          )}
        </div>

        {/* 데스크톱 우측 340px 예약 요약 — 모바일에서는 예약 탭만 쓴다 */}
        <aside className="card hidden flex-col gap-3 p-5 lg:flex">
          <h2 className="h-section">진료 예약</h2>
          <p className="text-sm text-stone-600">
            {hasAvailableSlot
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
