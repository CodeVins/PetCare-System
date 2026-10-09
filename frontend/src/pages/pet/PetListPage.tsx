import {
  CalendarCheck,
  CaretRight,
  ClipboardText,
  MagnifyingGlass,
  PawPrint,
  Plus,
  Syringe,
  type Icon,
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
import {
  calculateAge,
  formatDateTime,
  formatDday,
  formatSlot,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
} from '../../lib/format'
import type { Pet, Reservation, UpcomingVaccination } from '../../types/api'

// 사진이 없는 반려동물의 커버 색 — teal → amber → sky 순환 (DESIGN_SPEC 보조 액센트)
const COVER_ACCENTS = [
  'bg-brand-50 text-brand-600',
  'bg-amber-50 text-amber-600',
  'bg-sky-50 text-sky-600',
]

function Panel({
  id,
  title,
  icon: PanelIcon,
  count,
  moreTo,
  children,
}: {
  id: string
  title: string
  icon: Icon
  count: number
  moreTo?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="card flex flex-col p-5 md:p-6">
      <div className="mb-2 flex items-center gap-3 border-b border-stone-100 pb-3">
        <span className="icon-badge size-10 shrink-0">
          <PanelIcon size={20} />
        </span>
        <h3 id={id} className="h-section flex-1">
          {title}
          {count > 0 && <span className="ml-1.5 text-brand-700">{count}</span>}
        </h3>
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

// 카드 아래칸 — "다음 접종 D-3"처럼 이 아이의 가장 가까운 일정 하나
function CardFact({ label, value, urgent }: { label: string; value: string | null; urgent?: boolean }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd
        className={`mt-0.5 truncate text-sm ${value ? `font-bold ${urgent ? 'text-red-700' : 'text-stone-800'}` : 'text-stone-400'}`}
      >
        {value ?? '없음'}
      </dd>
    </div>
  )
}

function PetCard({
  pet,
  index,
  vaccination,
  reservation,
}: {
  pet: Pet
  index: number
  vaccination?: UpcomingVaccination
  reservation?: Reservation
}) {
  const age = calculateAge(pet.birthDate)
  // 파일이 지워진 사진 등 로딩 실패 시 깨진 이미지 대신 기본 커버로
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = pet.imageUrl && !imageFailed
  const facts = [
    pet.breed || '품종 미등록',
    age !== null && `${age}살`,
    pet.sex && SEX_LABEL[pet.sex],
    pet.size && SIZE_LABEL[pet.size],
    pet.neutered && '중성화',
  ].filter(Boolean)

  return (
    <Link to={`/pets/${pet.id}`} className="card-interactive group flex flex-col overflow-hidden">
      <div
        className={`relative aspect-video sm:aspect-[4/3] ${showImage ? 'bg-stone-100' : COVER_ACCENTS[index % COVER_ACCENTS.length]}`}
      >
        {showImage ? (
          <img
            src={`${BASE_URL}${pet.imageUrl}`}
            alt={`${pet.name} 사진`}
            onError={() => setImageFailed(true)}
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-2">
            <PawPrint size={64} weight="duotone" />
            <span className="text-[13px] text-stone-500">사진을 등록해 보세요</span>
          </span>
        )}
        <span className="absolute left-3 top-3 flex gap-1.5">
          <span className="badge h-6 bg-white/90 px-2.5 text-xs text-stone-800 shadow-sm">
            {SPECIES_LABEL[pet.species] ?? pet.species}
          </span>
          {pet.role === 'GUARDIAN' && (
            <span className="badge h-6 bg-white/90 px-2.5 text-xs text-stone-800 shadow-sm">
              공동보호자
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl text-stone-900">{pet.name}</p>
          <p className="mt-0.5 truncate text-[13px] text-stone-600">{facts.join(' · ')}</p>
        </div>
        <CaretRight size={18} className="shrink-0 text-stone-400 group-hover:text-brand-600" />
      </div>

      <dl className="mt-auto grid grid-cols-2 divide-x divide-stone-100 border-t border-stone-100">
        <CardFact
          label="다음 접종"
          value={vaccination ? formatDday(vaccination.daysRemaining) : null}
          urgent={vaccination !== undefined && vaccination.daysRemaining <= 7}
        />
        <CardFact
          label="다음 예약"
          value={reservation ? formatDateTime(reservation.startTime) : null}
        />
      </dl>
    </Link>
  )
}

// 변경(2026-09-27): 로그인 홈(MemberHome)에 있던 인사말·다가오는 접종·다가오는 예약·바로가기를
// 이 화면으로 옮김 — 홈은 회원/비회원 공용 화면 하나로 통일 (이전: 반려동물 카드 목록만 표시)
// 변경(2026-10-09): 작은 아바타 카드 4열 → 사진이 크게 보이는 카드 3열(아이별 다음 접종·예약 표시),
// 등록은 점선 카드 대신 헤더 버튼으로, 접종·예약은 "일정" 구역으로 분리
// (이전: 카드가 작고 화면 폭에 안 맞았으며, 등록 카드가 목록에 섞여 있었음)
export default function PetListPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [vaccinations, setVaccinations] = useState<UpcomingVaccination[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // 세 목록은 서로 독립이라 하나가 실패해도 나머지는 그린다
    // 변경(2026-10-09): 다가오는 예약은 서버가 거르고 가까운 순으로 줌 (이전: 전체 첫 페이지를 받아 화면에서 거름 —
    // 예약이 20개 넘으면 다가오는 예약이 빠질 수 있었음)
    Promise.allSettled([getMyPets(), getUpcomingVaccinations(), getMyReservations(0, { view: 'UPCOMING' })])
      .then(([petsRes, vaccinationsRes, reservationsRes]) => {
        if (petsRes.status === 'fulfilled') setPets(petsRes.value.data.data.content)
        // 둘 다 가까운 순으로 정렬 — 카드의 "다음 접종/예약"은 이 순서에서 처음 찾은 것
        if (vaccinationsRes.status === 'fulfilled')
          setVaccinations(
            [...vaccinationsRes.value.data.data].sort((a, b) => a.daysRemaining - b.daysRemaining),
          )
        if (reservationsRes.status === 'fulfilled')
          setReservations(reservationsRes.value.data.data.content)
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
              반려동물 등록
            </Link>
          </>
        }
      />

      <section aria-labelledby="h-pets">
        <h2 id="h-pets" className="h-section mb-3">
          내 반려동물
          {pets.length > 0 && <span className="ml-1.5 text-brand-700">{pets.length}</span>}
        </h2>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-stone-100" />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet, index) => (
              <PetCard
                key={pet.id}
                pet={pet}
                index={index}
                vaccination={vaccinations.find((v) => v.petId === pet.id)}
                reservation={reservations.find((r) => r.petId === pet.id)}
              />
            ))}
          </div>
        )}
      </section>

      {!loading && (
        <section aria-labelledby="h-schedule" className="mt-10">
          <h2 id="h-schedule" className="h-section mb-3">
            일정
          </h2>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <Panel id="h-vaccination" title="다가오는 접종" icon={Syringe} count={vaccinations.length}>
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

            <Panel
              id="h-reservation"
              title="다가오는 예약"
              icon={CalendarCheck}
              count={reservations.length}
              moreTo="/reservations"
            >
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
        </section>
      )}
    </div>
  )
}
