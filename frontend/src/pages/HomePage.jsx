import {
  CalendarCheck,
  ClipboardText,
  MagnifyingGlass,
  PawPrint,
  Plus,
  Syringe,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../api/axiosInstance'
import { getMyPets } from '../api/petApi'
import { getMyReservationsDetailed } from '../api/reservationApi'
import { getUpcomingVaccinations } from '../api/userApi'
import EmptyState from '../components/common/EmptyState'
import { Reveal, RevealItem } from '../components/common/Reveal'
import StatusBadge from '../components/common/StatusBadge'
import { formatDday, formatSlot, petSubtitle } from '../lib/format'

// 보조 액센트 순환 (teal → amber → sky)
const ACCENTS = ['', 'icon-badge-amber', 'icon-badge-sky']

const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED']

function SectionHeading({ children, moreTo, moreLabel = '전체 보기' }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="h-section">{children}</h2>
      {moreTo && (
        <Link
          to={moreTo}
          className="flex min-h-11 items-center text-sm font-medium text-brand-600"
        >
          {moreLabel}
        </Link>
      )}
    </div>
  )
}

function PetAvatars({ pets }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
      {pets.map((pet, index) => (
        <Link
          key={pet.id}
          to={`/pets/${pet.id}`}
          className="flex w-[76px] shrink-0 flex-col items-center gap-1 text-center"
        >
          <span
            className={`icon-badge size-16 overflow-hidden transition-transform duration-150 hover:scale-105 motion-reduce:transform-none ${
              ACCENTS[index % ACCENTS.length]
            }`}
          >
            {pet.imageUrl ? (
              <img
                src={`${BASE_URL}${pet.imageUrl}`}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <PawPrint size={30} />
            )}
          </span>
          <span className="w-full truncate font-bold">{pet.name}</span>
          <span className="w-full truncate text-xs text-stone-600">
            {petSubtitle(pet)}
          </span>
        </Link>
      ))}

      <Link
        to="/pets/new"
        className="flex w-[76px] shrink-0 flex-col items-center gap-1 text-center"
      >
        <span className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-stone-400 text-stone-600 transition-colors hover:border-brand-600 hover:text-brand-600">
          <Plus size={26} />
        </span>
        <span className="font-medium text-stone-600">등록</span>
      </Link>
    </div>
  )
}

export default function HomePage() {
  const [pets, setPets] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // 한 화면이 3개 소스를 쓰지만 서로 독립이라 하나가 실패해도 나머지는 그린다.
    Promise.allSettled([
      getMyPets(),
      getUpcomingVaccinations(),
      getMyReservationsDetailed(),
    ])
      .then(([petsRes, vaccinationsRes, reservationsRes]) => {
        if (petsRes.status === 'fulfilled') setPets(petsRes.value.data.data.content)
        if (vaccinationsRes.status === 'fulfilled')
          setVaccinations(vaccinationsRes.value.data.data)
        if (reservationsRes.status === 'fulfilled')
          setReservations(
            reservationsRes.value.filter((r) => UPCOMING_STATUSES.includes(r.status)),
          )
        if ([petsRes, vaccinationsRes, reservationsRes].every((r) => r.status === 'rejected'))
          setError('정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => setLoading(false))
  }, [])

  const petNames = pets.map((pet) => pet.name)
  const greeting =
    petNames.length > 0
      ? `${petNames.slice(0, 2).join('와 ')}의 오늘을 확인해 보세요.`
      : '반려동물을 등록하고 오늘을 관리해 보세요.'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7 md:gap-8">
      <div>
        <h1 className="text-[28px] leading-tight md:text-[38px]">안녕하세요</h1>
        <p className="mt-1 text-stone-600 md:text-[17px]">{greeting}</p>
      </div>

      {error && <p className="text-[15px] text-red-600">{error}</p>}

      {/* 데스크톱 12칼럼: 왼쪽 7(접종/예약) · 오른쪽 5(반려동물/바로가기) */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12 md:gap-x-6">
        <div className="flex flex-col gap-6 md:col-span-7">
          <section className="md:card md:p-6" aria-labelledby="h-vaccination">
            <div className="mb-3 md:mb-4">
              <h2 id="h-vaccination" className="h-section">
                다가오는 접종
              </h2>
            </div>

            {vaccinations.length === 0 ? (
              <EmptyState icon={Syringe}>예정된 접종이 없습니다.</EmptyState>
            ) : (
              <Reveal className="flex flex-col gap-2.5 md:gap-3" stagger={0.06}>
                {vaccinations.map((item, index) => (
                  <RevealItem key={item.healthRecordId}>
                    <Link
                      to={`/pets/${item.petId}`}
                      className="card-interactive flex items-center gap-3 p-3.5 md:rounded-xl md:border-0 md:bg-stone-50 md:p-4 md:shadow-none"
                    >
                      <span
                        className={`icon-badge md:size-12 ${ACCENTS[index % ACCENTS.length]}`}
                      >
                        <Syringe size={22} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-bold">{item.petName}</span>
                        <span className="truncate text-[13px] text-stone-600 md:text-sm">
                          예정일 {item.nextDueDate}
                        </span>
                      </span>
                      <span
                        className={`badge ${
                          item.daysRemaining <= 7 ? 'badge-danger' : 'badge-neutral'
                        }`}
                      >
                        {formatDday(item.daysRemaining)}
                      </span>
                    </Link>
                  </RevealItem>
                ))}
              </Reveal>
            )}
          </section>

          <section className="md:card md:p-6" aria-labelledby="h-reservation">
            <SectionHeading moreTo="/reservations">
              <span id="h-reservation">다가오는 예약</span>
            </SectionHeading>

            {reservations.length === 0 ? (
              <EmptyState icon={CalendarCheck}>예정된 예약이 없습니다.</EmptyState>
            ) : (
              <Reveal className="flex flex-col gap-2.5 md:gap-3" stagger={0.06}>
                {reservations.slice(0, 3).map((reservation) => (
                  <RevealItem key={reservation.id}>
                    <Link
                      to="/reservations"
                      className="card-interactive flex items-center gap-3 p-3.5 md:rounded-xl md:border-0 md:bg-stone-50 md:p-4 md:shadow-none"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                        <CalendarCheck size={24} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-bold">
                          {reservation.hospitalName}
                        </span>
                        <span className="truncate text-[13px] text-stone-600 md:text-sm">
                          {reservation.slot ? formatSlot(reservation.slot) : '시간 정보 없음'}
                          {` · ${reservation.petName}`}
                        </span>
                      </span>
                      <StatusBadge status={reservation.status} />
                    </Link>
                  </RevealItem>
                ))}
              </Reveal>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6 md:col-span-5">
          <section className="md:card md:p-6" aria-labelledby="h-pets">
            <SectionHeading moreTo="/pets">
              <span id="h-pets">내 반려동물</span>
            </SectionHeading>
            <PetAvatars pets={pets} />
          </section>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <Link
              to="/hospitals"
              className="flex min-h-28 flex-col justify-between rounded-2xl bg-brand-600 p-4 text-white shadow transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"
            >
              <MagnifyingGlass size={26} />
              <span className="flex flex-col">
                <span className="text-base font-bold">병원 찾기</span>
                <span className="text-[13px] text-brand-100">내 주변 병원 검색</span>
              </span>
            </Link>

            <Link
              to="/health-check"
              className="card-interactive flex min-h-28 flex-col justify-between p-4"
            >
              <ClipboardText size={26} className="text-brand-600" />
              <span className="flex flex-col">
                <span className="text-base font-bold">건강 자가문진</span>
                <span className="text-[13px] text-stone-600">문항으로 빠르게 확인</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
