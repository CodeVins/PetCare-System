import { Buildings, Heart, Star } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'

// 보조 액센트 순환 (teal → amber → sky)
const THUMB_ACCENTS = [
  'bg-brand-100 text-brand-600',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
]

export default function HospitalCard({ hospital, isFavorite, onToggleFavorite, index = 0 }) {
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
          <img
            src={`${BASE_URL}${hospital.imageUrl}`}
            alt=""
            className="size-full object-cover"
          />
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

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {hospital.is24Hours && (
            <span className="badge badge-neutral h-6 px-2 text-xs">24시간</span>
          )}
          {hospital.hasParking && (
            <span className="badge badge-neutral h-6 px-2 text-xs">주차 가능</span>
          )}
          {hospital.openingHours && (
            <span className="text-xs leading-6 text-stone-600">
              {hospital.openingHours}
            </span>
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
