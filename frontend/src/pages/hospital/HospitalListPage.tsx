import { Buildings, Crosshair, MagnifyingGlass, SlidersHorizontal } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { errorMessage } from '../../api/axiosInstance'
import { getHospitals } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Reveal, RevealItem } from '../../components/common/Reveal'
import SelectField from '../../components/common/SelectField'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteIds } from '../../hooks/useFavoriteIds'
import type { Hospital, HospitalSort } from '../../types/api'
import HospitalCard from './HospitalCard'
import HospitalTabs from './HospitalTabs'

const SORT_OPTIONS: { value: HospitalSort; label: string }[] = [
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

const RADIUS_OPTIONS = [1, 3, 5, 10].map((km) => ({
  value: String(km),
  label: `${km}km 이내`,
}))

// 비회원도 볼 수 있는 화면 (백엔드 GET /api/hospitals 공개)
export default function HospitalListPage() {
  const { isAuthenticated } = useAuth()
  // 변경(2026-09-27): 홈 검색창·바로 찾기 링크가 넘긴 쿼리(?keyword=, ?is24Hours=true 등)로 초기 필터를 채움
  // (이전: 항상 빈 필터로 시작)
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '')
  const [sort, setSort] = useState<HospitalSort>('NAME_ASC')
  const [is24Hours, setIs24Hours] = useState(searchParams.get('is24Hours') === 'true')
  const [hasParking, setHasParking] = useState(searchParams.get('hasParking') === 'true')
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [radiusKm, setRadiusKm] = useState(5)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState('')
  // 모바일에서만 접었다 펴는 필터 영역 (데스크톱은 항상 보이는 사이드바)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 변경(2026-09-27): 즐겨찾기 조회/토글을 useFavoriteIds(useOptimistic)로 분리, 비회원이면 하트 숨김
  // (이전: 이 화면에서 Set을 직접 들고 실패 시 수동 롤백, 비회원 개념 없음)
  const { favoriteIds, toggleFavorite } = useFavoriteIds()

  useEffect(() => {
    setLoading(true)
    setError('')
    // 검색어 입력 중에는 300ms 쉬었다가 한 번만 호출
    const timeout = setTimeout(() => {
      getHospitals({
        keyword: keyword || undefined,
        minRating: minRating ? Number(minRating) : undefined,
        sort: locationEnabled ? undefined : sort,
        lat: locationEnabled ? coords?.lat : undefined,
        lng: locationEnabled ? coords?.lng : undefined,
        radiusKm: locationEnabled ? radiusKm : undefined,
        is24Hours: is24Hours || undefined,
        hasParking: hasParking || undefined,
      })
        .then(({ data }) => setHospitals(data.data))
        .catch((err) => setError(errorMessage(err, '병원 목록을 불러오지 못했습니다.')))
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
      () => setGeoError('위치 정보를 가져오지 못했습니다. 브라우저 권한을 확인해 주세요.'),
    )
  }

  const activeFilterCount =
    (minRating ? 1 : 0) + (is24Hours ? 1 : 0) + (hasParking ? 1 : 0) + (locationEnabled ? 1 : 0)

  const filters = (
    <div className="flex flex-col gap-4">
      {/* 자주 쓰는 세 개는 칩으로 바로 노출 */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={locationEnabled}
          onClick={() => {
            if (locationEnabled) {
              setLocationEnabled(false)
              setCoords(null)
            } else {
              enableLocation()
            }
          }}
          className={`chip ${locationEnabled ? 'chip-on' : ''}`}
        >
          <Crosshair size={16} />
          내 주변 {locationEnabled ? `${radiusKm}km` : ''}
        </button>
        <button
          type="button"
          aria-pressed={is24Hours}
          onClick={() => setIs24Hours((v) => !v)}
          className={`chip ${is24Hours ? 'chip-soft' : ''}`}
        >
          24시간
        </button>
        <button
          type="button"
          aria-pressed={hasParking}
          onClick={() => setHasParking((v) => !v)}
          className={`chip ${hasParking ? 'chip-soft' : ''}`}
        >
          주차 가능
        </button>
      </div>

      <SelectField
        label="평점"
        value={minRating}
        options={RATING_OPTIONS}
        onChange={(event) => setMinRating(event.target.value)}
      />

      <SelectField
        label="정렬"
        value={sort}
        options={SORT_OPTIONS}
        disabled={locationEnabled}
        hint={locationEnabled ? '내 주변을 켜면 거리순으로 정렬됩니다.' : undefined}
        onChange={(event) => setSort(event.target.value as HospitalSort)}
      />

      {locationEnabled && (
        <SelectField
          label="반경"
          value={String(radiusKm)}
          options={RADIUS_OPTIONS}
          onChange={(event) => setRadiusKm(Number(event.target.value))}
        />
      )}

      <Alert tone="error">{geoError}</Alert>
    </div>
  )

  return (
    <div>
      <title>병원 찾기 | 펫케어</title>
      <PageHeader
        title="병원"
        subtitle={isAuthenticated ? undefined : '로그인하면 바로 예약하고 즐겨찾기할 수 있어요'}
      />
      <HospitalTabs />

      <div className="grid gap-5 md:grid-cols-[280px_1fr] md:items-start md:gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={20}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600"
              />
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                aria-label="병원 이름 검색"
                placeholder="병원 이름을 검색해 보세요"
                className="input pl-11"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-label={
                activeFilterCount > 0
                  ? `필터 열기, 적용된 필터 ${activeFilterCount}개`
                  : '필터 열기'
              }
              className="relative flex size-12 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-800 transition-colors hover:bg-stone-50 md:hidden"
            >
              <SlidersHorizontal size={22} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* 모바일: 버튼으로 토글 / 데스크톱: 항상 보이는 필터 사이드바 */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
            <div className="md:card md:p-5">{filters}</div>
          </div>
        </div>

        <div>
          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-30 animate-pulse rounded-2xl bg-stone-100" />
              ))}
            </div>
          )}

          {!loading && error && <Alert tone="error">{error}</Alert>}

          {!loading && !error && hospitals.length === 0 && (
            <div className="card">
              <EmptyState icon={Buildings}>조건에 맞는 병원이 없습니다.</EmptyState>
            </div>
          )}

          {!loading && !error && hospitals.length > 0 && (
            <Reveal className="flex flex-col gap-3" stagger={0.05}>
              {hospitals.map((hospital, index) => (
                <RevealItem key={hospital.id}>
                  <HospitalCard
                    hospital={hospital}
                    index={index}
                    isFavorite={favoriteIds.has(hospital.id)}
                    onToggleFavorite={isAuthenticated ? toggleFavorite : undefined}
                  />
                </RevealItem>
              ))}
            </Reveal>
          )}
        </div>
      </div>
    </div>
  )
}
