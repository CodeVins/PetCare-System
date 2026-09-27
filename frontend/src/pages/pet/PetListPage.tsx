import {
  CalendarCheck,
  CaretRight,
  ClipboardText,
  MagnifyingGlass,
  PawPrint,
  Plus,
  Syringe,
} from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import { getMyPets } from '../../api/petApi'
import { getMyReservations } from '../../api/reservationApi'
import { getUpcomingVaccinations } from '../../api/userApi'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { calculateAge, formatDday, formatSlot, SPECIES_LABEL } from '../../lib/format'
import type { Pet, Reservation, ReservationStatus, UpcomingVaccination } from '../../types/api'

// 카드마다 액센트를 teal → amber → sky 로 돌린다 (DESIGN_SPEC 보조 액센트 순환)
const ACCENTS = [
  ['icon-badge', 'bg-brand-50 text-brand-700'],
  ['icon-badge icon-badge-amber', 'bg-amber-50 text-amber-800'],
  ['icon-badge icon-badge-sky', 'bg-sky-50 text-sky-800'],
]

const UPCOMING_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED']

function Panel({
  id,
  title,
  moreTo,
  children,
}: {
  id: string
  title: string
  moreTo?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="card flex flex-col p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 id={id} className="h-section">
          {title}
        </h2>
        {moreTo && (
          <Link
            to={moreTo}
            className="flex min-h-11 items-center gap-0.5 text-sm text-stone-600 hover:text-brand-600"
          >
            전체보기
            <CaretRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

// 변경(2026-09-27): 로그인 홈(MemberHome)에 있던 인사말·다가오는 접종·다가오는 예약·바로가기를
// 이 화면으로 옮김 — 홈은 회원/비회원 공용 화면 하나로 통일 (이전: 반려동물 카드 목록만 표시)
export default function PetListPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [vaccinations, setVaccinations] = useState<UpcomingVaccination[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // 세 목록은 서로 독립이라 하나가 실패해도 나머지는 그린다
    Promise.allSettled([getMyPets(), getUpcomingVaccinations(), getMyReservations()])
      .then(([petsRes, vaccinationsRes, reservationsRes]) => {
        if (petsRes.status === 'fulfilled') setPets(petsRes.value.data.data.content)
        if (vaccinationsRes.status === 'fulfilled') setVaccinations(vaccinationsRes.value.data.data)
        if (reservationsRes.status === 'fulfilled')
          setReservations(
            reservationsRes.value.data.data.content.filter((r) =>
              UPCOMING_STATUSES.includes(r.status),
            ),
          )
        if (petsRes.status === 'rejected') setError('반려동물 목록을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  const petNames = pets.map((pet) => pet.name)
  const subtitle =
    petNames.length > 0
      ? `${petNames.slice(0, 2).join(', ')}${petNames.length > 2 ? ` 외 ${petNames.length - 2}마리` : ''}의 일정을 확인하세요`
      : undefined

  return (
    <div>
      <title>반려동물 | 펫케어</title>
      <PageHeader
        title="반려동물"
        subtitle={subtitle}
        action={
          <>
            <Link to="/health-check" className="btn btn-secondary btn-sm">
              <ClipboardText size={18} />
              <span className="hidden sm:inline">건강 자가문진</span>
            </Link>
            <Link to="/pets/new" className="btn btn-primary btn-sm">
              <Plus size={18} weight="bold" />
              등록
            </Link>
          </>
        }
      />

      {loading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-49 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-[15px] text-red-600">{error}</p>}

      {!loading && !error && pets.length === 0 && (
        <div className="card">
          <EmptyState
            icon={PawPrint}
            action={
              <Link to="/pets/new" className="btn btn-primary btn-sm">
                <Plus size={18} weight="bold" />
                반려동물 등록
              </Link>
            }
          >
            등록된 반려동물이 없습니다. 첫 반려동물을 등록해 보세요.
          </EmptyState>
        </div>
      )}

      {!loading && !error && pets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {pets.map((pet, index) => {
            const age = calculateAge(pet.birthDate)
            const [avatarClass, speciesClass] = ACCENTS[index % ACCENTS.length]
            return (
              <Link
                key={pet.id}
                to={`/pets/${pet.id}`}
                className="card-interactive flex h-full flex-col items-center gap-1.5 px-3 pb-4 pt-5 text-center"
              >
                <span className={`${avatarClass} mb-1 size-20 overflow-hidden`}>
                  {pet.imageUrl ? (
                    <img src={`${BASE_URL}${pet.imageUrl}`} alt="" className="size-full object-cover" />
                  ) : (
                    <PawPrint size={38} />
                  )}
                </span>
                <span className="w-full truncate text-[17px] font-bold">{pet.name}</span>
                <span className="flex flex-wrap justify-center gap-1.5">
                  <span className={`badge h-6 px-2.5 text-xs ${speciesClass}`}>
                    {SPECIES_LABEL[pet.species] ?? pet.species}
                  </span>
                  {pet.role === 'GUARDIAN' && (
                    <span className="badge badge-neutral h-6 px-2.5 text-xs">공동보호자</span>
                  )}
                </span>
                <span className="w-full truncate text-[13px] text-stone-600">
                  {pet.breed || '품종 미등록'}
                  {age !== null && ` · ${age}살`}
                </span>
              </Link>
            )
          })}

          <Link
            to="/pets/new"
            className="flex h-full min-h-49 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 p-4 text-stone-600 transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            <Plus size={30} />
            <span className="text-sm font-medium">반려동물 등록</span>
          </Link>
        </div>
      )}

      {!loading && (
        <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
          <Panel id="h-vaccination" title="다가오는 접종">
            {vaccinations.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-500">
                예정된 접종이 없습니다.
                <br />
                건강기록에 접종과 다음 접종일을 남기면 여기에 표시됩니다.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {vaccinations.map((item) => (
                  <li key={item.healthRecordId}>
                    <Link
                      to={`/pets/${item.petId}`}
                      className="flex items-center gap-3 py-3 hover:text-brand-700"
                    >
                      <Syringe size={20} className="shrink-0 text-stone-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{item.petName}</span>
                        <span className="block text-[13px] text-stone-600">
                          예정일 {item.nextDueDate.replaceAll('-', '.')}
                        </span>
                      </span>
                      <span
                        className={`badge ${item.daysRemaining <= 7 ? 'badge-danger' : 'badge-neutral'}`}
                      >
                        {formatDday(item.daysRemaining)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel id="h-reservation" title="다가오는 예약" moreTo="/reservations">
            {reservations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-5 text-center text-sm text-stone-500">
                예정된 예약이 없습니다.
                <Link to="/hospitals" className="btn btn-secondary btn-sm">
                  <MagnifyingGlass size={16} />
                  병원 찾기
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {reservations.slice(0, 3).map((reservation) => (
                  <li key={reservation.id}>
                    <Link
                      to="/reservations"
                      className="flex items-center gap-3 py-3 hover:text-brand-700"
                    >
                      <CalendarCheck size={20} className="shrink-0 text-stone-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{reservation.hospitalName}</span>
                        <span className="block truncate text-[13px] text-stone-600">
                          {formatSlot(reservation)} · {reservation.petName}
                        </span>
                      </span>
                      <StatusBadge status={reservation.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
