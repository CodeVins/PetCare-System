import { CalendarCheck, ChatCircleDots, Heart, MapPin, Star } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrCreateChatRoom } from '../../api/chatApi'
import { BASE_URL } from '../../api/axiosInstance'
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
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import ReviewSection from './ReviewSection'

const MANAGER_ROLES = ['HOSPITAL_OWNER', 'ADMIN']

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
  const { role } = useAuth()

  const [hospital, setHospital] = useState(null)
  const [slots, setSlots] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [selectedPetId, setSelectedPetId] = useState('')
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')

  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteSaving, setFavoriteSaving] = useState(false)
  const [chatError, setChatError] = useState('')

  const [waitlistJoiningId, setWaitlistJoiningId] = useState(null)
  const [waitlistMessage, setWaitlistMessage] = useState('')

  useEffect(() => {
    Promise.all([
      getHospital(hospitalId),
      getSlots(hospitalId),
      getMyPets(),
      getFavorites(),
    ])
      .then(([hospitalRes, slotsRes, petsRes, favoritesRes]) => {
        setHospital(hospitalRes.data.data)
        setSlots(slotsRes.data.data.content)
        setPets(petsRes.data.data.content)
        if (petsRes.data.data.content.length > 0) {
          setSelectedPetId(String(petsRes.data.data.content[0].id))
        }
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
      if (next) {
        await addFavorite(hospitalId)
      } else {
        await removeFavorite(hospitalId)
      }
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

  const handleJoinWaitlist = async (slotId) => {
    setWaitlistMessage('')
    if (!selectedPetId) {
      setWaitlistMessage('반려동물을 선택해주세요.')
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
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      {hospital.imageUrl && (
        <img
          src={`${BASE_URL}${hospital.imageUrl}`}
          alt=""
          className="h-40 w-full rounded-2xl object-cover"
        />
      )}

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{hospital.name}</h1>
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={favoriteSaving}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-stone-100 hover:text-red-500 disabled:cursor-not-allowed"
          >
            <Heart
              size={20}
              weight={isFavorite ? 'fill' : 'regular'}
              className={isFavorite ? 'text-red-500' : ''}
            />
          </button>
        </div>
        {hospital.address && (
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-500">
            <MapPin size={14} />
            {hospital.address}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-stone-500">
          {hospital.averageRating != null && (
            <span className="flex items-center gap-1 font-medium text-amber-600">
              <Star weight="fill" size={14} />
              {hospital.averageRating.toFixed(1)}
              <span className="text-stone-400">({hospital.reviewCount})</span>
            </span>
          )}
          {hospital.specialty && <span>{hospital.specialty}</span>}
          {hospital.openingHours && <span>{hospital.openingHours}</span>}
          {hospital.is24Hours && <span>24시간</span>}
          {hospital.hasParking && <span>주차 가능</span>}
          {hospital.avgTreatmentPrice != null && (
            <span>평균 진료비 {hospital.avgTreatmentPrice.toLocaleString()}원</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleChatClick}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-brand-200 hover:text-brand-700"
        >
          <ChatCircleDots size={16} />
          병원에 문의하기
        </button>
        {chatError && <p className="mt-1 text-sm text-red-600">{chatError}</p>}
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
              예약 시간 (마감된 시간은 대기 신청 가능)
            </span>

            {slotsByDate.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-12 text-center">
                <CalendarCheck size={28} className="text-stone-300" />
                <p className="text-sm text-stone-500">등록된 예약 시간이 없습니다.</p>
              </div>
            )}

            <div className="space-y-4">
              {slotsByDate.map(([dateKey, dateSlots]) => (
                <div key={dateKey}>
                  <p className="mb-2 text-xs font-semibold text-stone-500">
                    {formatDateLabel(dateKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map((slot) =>
                      slot.status === 'AVAILABLE' ? (
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
                      ) : (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleJoinWaitlist(slot.id)}
                          disabled={waitlistJoiningId === slot.id}
                          className="rounded-full border border-dashed border-stone-200 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-400 transition-colors hover:border-brand-200 hover:text-brand-600 disabled:cursor-not-allowed"
                        >
                          {formatTimeRange(slot.startTime, slot.endTime)} · 대기 신청
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
            {waitlistMessage && <p className="mt-2 text-sm text-stone-500">{waitlistMessage}</p>}
          </div>

          {reserveError && <p className="text-sm text-red-600">{reserveError}</p>}

          <Button
            type="button"
            onClick={handleReserve}
            loading={reserving}
            disabled={!slots.some((slot) => slot.status === 'AVAILABLE')}
            className="w-full"
          >
            예약하기
          </Button>
        </>
      )}

      <div className="mt-8">
        <ReviewSection hospitalId={hospitalId} isManager={MANAGER_ROLES.includes(role)} />
      </div>
    </div>
  )
}
