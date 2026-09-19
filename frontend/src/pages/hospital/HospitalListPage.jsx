import { Buildings, Crosshair, MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { addFavorite, getFavorites, getHospitals, removeFavorite } from '../../api/hospitalApi'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import HospitalCard from './HospitalCard'

const SORT_OPTIONS = [
  { value: 'NAME_ASC', label: '이름순' },
  { value: 'RATING_DESC', label: '평점순' },
  { value: 'REVIEW_COUNT_DESC', label: '리뷰 많은순' },
]

const RATING_OPTIONS = [
  { value: '', label: '평점 전체' },
  { value: '3', label: '3.0 이상' },
  { value: '4', label: '4.0 이상' },
  { value: '4.5', label: '4.5 이상' },
]

const RADIUS_OPTIONS = [1, 3, 5, 10]

const selectClassName =
  'rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50'

export default function HospitalListPage() {
  const [keyword, setKeyword] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState('NAME_ASC')
  const [is24Hours, setIs24Hours] = useState(false)
  const [hasParking, setHasParking] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [radiusKm, setRadiusKm] = useState(5)
  const [coords, setCoords] = useState(null)
  const [geoError, setGeoError] = useState('')

  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [favoriteIds, setFavoriteIds] = useState(new Set())

  useEffect(() => {
    getFavorites()
      .then(({ data }) => setFavoriteIds(new Set(data.data.content.map((h) => h.id))))
      .catch(() => {})
  }, [])

  const toggleFavorite = async (hospitalId) => {
    const isFav = favoriteIds.has(hospitalId)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (isFav) next.delete(hospitalId)
      else next.add(hospitalId)
      return next
    })
    try {
      if (isFav) {
        await removeFavorite(hospitalId)
      } else {
        await addFavorite(hospitalId)
      }
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (isFav) next.add(hospitalId)
        else next.delete(hospitalId)
        return next
      })
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    const timeout = setTimeout(() => {
      getHospitals({
        keyword: keyword || undefined,
        minRating: minRating || undefined,
        sort: locationEnabled ? undefined : sort,
        lat: locationEnabled ? coords?.lat : undefined,
        lng: locationEnabled ? coords?.lng : undefined,
        radiusKm: locationEnabled ? radiusKm : undefined,
        is24Hours: is24Hours || undefined,
        hasParking: hasParking || undefined,
      })
        .then(({ data }) => setHospitals(data.data))
        .catch((err) =>
          setError(err.response?.data?.message || '병원 목록을 불러오지 못했습니다.'),
        )
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [keyword, minRating, sort, locationEnabled, coords, radiusKm, is24Hours, hasParking])

  const enableLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('이 브라우저는 위치 정보를 지원하지 않습니다.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationEnabled(true)
        setGeoError('')
      },
      () => {
        setGeoError('위치 정보를 가져오지 못했습니다. 브라우저 권한을 확인해주세요.')
      },
    )
  }

  const disableLocation = () => {
    setLocationEnabled(false)
    setCoords(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">병원</h1>

      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="병원 이름으로 검색"
            className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            className={selectClassName}
          >
            {RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            disabled={locationEnabled}
            className={selectClassName}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={locationEnabled ? disableLocation : enableLocation}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              locationEnabled
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-stone-200 text-stone-700 hover:border-brand-200'
            }`}
          >
            <Crosshair size={16} />
            내 주변
          </button>

          {locationEnabled && (
            <select
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className={selectClassName}
            >
              {RADIUS_OPTIONS.map((km) => (
                <option key={km} value={km}>
                  {km}km 이내
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={is24Hours}
              onChange={(event) => setIs24Hours(event.target.checked)}
              className="accent-brand-600"
            />
            24시간
          </label>
          <label className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={hasParking}
              onChange={(event) => setHasParking(event.target.checked)}
              className="accent-brand-600"
            />
            주차 가능
          </label>
        </div>

        {geoError && <p className="text-sm text-red-600">{geoError}</p>}
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && hospitals.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <Buildings size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">조건에 맞는 병원이 없습니다.</p>
        </div>
      )}

      {!loading && !error && hospitals.length > 0 && (
        <Reveal className="space-y-3" stagger={0.05}>
          {hospitals.map((hospital) => (
            <RevealItem key={hospital.id}>
              <HospitalCard
                hospital={hospital}
                isFavorite={favoriteIds.has(hospital.id)}
                onToggleFavorite={toggleFavorite}
              />
            </RevealItem>
          ))}
        </Reveal>
      )}
    </div>
  )
}
