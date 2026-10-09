import { Buildings, Heart, Star } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import { HOSPITAL_ANIMAL_LABEL } from '../../lib/format'
import { hasNightHours, openStatus } from '../../lib/openingHours'
import type { Hospital } from '../../types/api'

// 보조 액센트 순환 (teal → amber → sky)
const THUMB_ACCENTS = [
  'bg-brand-100 text-brand-600',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
]

interface HospitalCardProps {
  hospital: Hospital
  isFavorite?: boolean
  // 없으면 하트 버튼을 그리지 않는다 (비회원 등)
  onToggleFavorite?: (hospitalId: number) => void
  index?: number
}

export default function HospitalCard({
  hospital,
  isFavorite = false,
  onToggleFavorite,
  index = 0,
}: HospitalCardProps) {
  const status = openStatus(hospital)
  return (
    <article className="card-interactive relative flex gap-3 p-3">
      {/* 카드 전체를 덮는 링크 — 안쪽 즐겨찾기 버튼만 위로 띄운다 */}
      <Link
        to={`/hospitals/${hospital.id}`}
        aria-label={`${hospital.name} 상세 보기`}
        className="absolute inset-0 rounded-2xl"
      />

      <span
        className={`flex size-23 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
          THUMB_ACCENTS[index % THUMB_ACCENTS.length]
        }`}
      >
        {hospital.imageUrl ? (
          <img src={`${BASE_URL}${hospital.imageUrl}`} alt="" className="size-full object-cover" />
        ) : (
          <Buildings size={36} />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="truncate pr-9 font-bold leading-snug">{hospital.name}</h3>

        <div className="flex items-center gap-1 text-[13px]">
          {hospital.averageRating != null && (
            <>
              <Star weight="fill" size={15} className="text-amber-600" />
              <b>{hospital.averageRating.toFixed(1)}</b>
              <span className="text-stone-600">({hospital.reviewCount})</span>
            </>
          )}
          {hospital.distanceKm != null && (
            <span className="text-stone-600">
              {hospital.averageRating != null && ' · '}
              {hospital.distanceKm.toFixed(1)}km
            </span>
          )}
        </div>

        {hospital.address && (
          <p className="truncate text-[13px] text-stone-600">{hospital.address}</p>
        )}
        {hospital.specialty && (
          <p className="truncate text-[13px] text-stone-600">{hospital.specialty}</p>
        )}
        {/* 변경(2026-10-09): 진료 동물 표시 (이전: 없음) */}
        {hospital.animals?.length > 0 && (
          <p className="truncate text-[13px] text-stone-600">
            {hospital.animals.map((animal) => HOSPITAL_ANIMAL_LABEL[animal]).join(' · ')} 진료
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {/* 변경(2026-10-05): 요일별 진료 시간으로 지금 진료 중/종료 표시 — 미등록이면 숨김 (이전: 자유 텍스트만) */}
          {status === 'open' && (
            <span className="badge h-6 bg-brand-50 px-2 text-xs font-bold text-brand-700">진료 중</span>
          )}
          {status === 'closed' && (
            <span className="badge badge-neutral h-6 px-2 text-xs text-stone-500">진료 종료</span>
          )}
          {hospital.is24Hours && (
            <span className="badge badge-neutral h-6 px-2 text-xs">24시간</span>
          )}
          {hasNightHours(hospital) && (
            <span className="badge badge-neutral h-6 px-2 text-xs">야간 진료</span>
          )}
          {hospital.hasParking && (
            <span className="badge badge-neutral h-6 px-2 text-xs">주차 가능</span>
          )}
          {hospital.openingHours && (
            <span className="text-xs leading-6 text-stone-600">{hospital.openingHours}</span>
          )}
        </div>
      </div>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(hospital.id)}
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          aria-pressed={isFavorite}
          className={`absolute right-0.5 top-0.5 flex size-11 items-center justify-center rounded-full transition-colors ${
            isFavorite ? 'text-brand-600' : 'text-stone-400 hover:text-brand-600'
          }`}
        >
          <Heart size={22} weight={isFavorite ? 'fill' : 'regular'} />
        </button>
      )}
    </article>
  )
}
