import { Buildings, Heart, MapPin, Star } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'

export default function HospitalCard({ hospital, isFavorite, onToggleFavorite }) {
  return (
    <div className="relative">
      <Link
        to={`/hospitals/${hospital.id}`}
        className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 pr-12 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
      >
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50">
          {hospital.imageUrl ? (
            <img
              src={`${BASE_URL}${hospital.imageUrl}`}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Buildings weight="fill" size={20} className="text-brand-600" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium text-stone-900">{hospital.name}</p>
            {hospital.distanceKm != null && (
              <span className="shrink-0 text-xs font-medium text-brand-600">
                {hospital.distanceKm.toFixed(1)}km
              </span>
            )}
          </div>
          {hospital.address && (
            <p className="flex items-center gap-1 truncate text-sm text-stone-500">
              <MapPin size={14} />
              {hospital.address}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
            {hospital.averageRating != null && (
              <span className="flex items-center gap-1 font-medium text-amber-600">
                <Star weight="fill" size={12} />
                {hospital.averageRating.toFixed(1)}
                <span className="text-stone-400">({hospital.reviewCount})</span>
              </span>
            )}
            {hospital.specialty && <span>{hospital.specialty}</span>}
            {hospital.openingHours && <span>{hospital.openingHours}</span>}
            {hospital.is24Hours && <span>24시간</span>}
            {hospital.hasParking && <span>주차 가능</span>}
          </div>
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            onToggleFavorite(hospital.id)
          }}
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-stone-100 hover:text-red-500"
        >
          <Heart
            size={18}
            weight={isFavorite ? 'fill' : 'regular'}
            className={isFavorite ? 'text-red-500' : ''}
          />
        </button>
      )}
    </div>
  )
}
