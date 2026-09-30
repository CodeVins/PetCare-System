import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getHospitals } from '../../api/hospitalApi'
import { getOwnedHospitals } from '../../api/userApi'
import { useAuth } from '../../hooks/useAuth'
import type { Hospital, ReviewFilter } from '../../types/api'

// 리뷰 관리 / 신고 관리 화면 공용 필터. 값은 URL 쿼리(?author=&from=...)에 둬서
// 새로고침·뒤로가기·다른 화면에서 링크(예: 사용자 상세 → 이 사용자 리뷰)로도 같은 결과가 나온다.
// 관리자(/admin)와 병원 소유자(/dashboard)가 같은 화면을 쓰고, 범위는 서버가 역할로 제한한다.

const KEYS = ['hospitalId', 'author', 'reporter', 'from', 'to', 'hidden', 'sort'] as const

export function useReviewFilter() {
  const [params, setParams] = useSearchParams()
  const filter: ReviewFilter = {}
  const get = (key: (typeof KEYS)[number]) => params.get(key) || undefined
  if (get('hospitalId')) filter.hospitalId = Number(get('hospitalId'))
  filter.author = get('author')
  filter.reporter = get('reporter')
  filter.from = get('from')
  filter.to = get('to')
  if (get('hidden')) filter.hidden = get('hidden') === 'true'
  filter.sort = get('sort')

  const setFilter = (next: ReviewFilter) => {
    const search = new URLSearchParams()
    for (const key of KEYS) {
      const value = next[key]
      if (value !== undefined && value !== '') search.set(key, String(value))
    }
    setParams(search, { replace: true })
  }

  // usePagedList 의 key — 쿼리 문자열이 바뀌면 0페이지부터 다시 받는다
  return { filter, setFilter, key: params.toString() }
}

// 관리자는 전체 병원, 병원 소유자는 본인 병원만 선택지로
function useHospitalOptions() {
  const { role } = useAuth()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  useEffect(() => {
    if (!role) return
    ;(role === 'ADMIN' ? getHospitals() : getOwnedHospitals())
      .then(({ data }) => setHospitals(data.data))
      .catch(() => setHospitals([]))
  }, [role])
  return hospitals
}

const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toISODate(date)
}

const PRESETS = [
  { label: '오늘', days: 0 },
  { label: '7일', days: 6 },
  { label: '30일', days: 29 },
]

interface ReviewFilterBarProps {
  filter: ReviewFilter
  onChange: (filter: ReviewFilter) => void
  mode: 'reviews' | 'reports'
}

export default function ReviewFilterBar({ filter, onChange, mode }: ReviewFilterBarProps) {
  const hospitals = useHospitalOptions()
  const dateLabel = mode === 'reviews' ? '작성일' : '신고일'
  const sortOptions =
    mode === 'reviews'
      ? [
          { value: '', label: '최신 작성순' },
          { value: 'createdAt,asc', label: '오래된 작성순' },
          { value: 'rating,asc', label: '별점 낮은순' },
          { value: 'rating,desc', label: '별점 높은순' },
        ]
      : [
          { value: '', label: '최신 신고순' },
          { value: 'createdAt,asc', label: '오래된 신고순' },
        ]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (name: string) => String(form.get(name) ?? '').trim() || undefined
    const hidden = text('hidden')
    onChange({
      hospitalId: text('hospitalId') ? Number(text('hospitalId')) : undefined,
      author: text('author'),
      reporter: text('reporter'),
      from: text('from'),
      to: text('to'),
      hidden: hidden === undefined ? undefined : hidden === 'true',
      sort: text('sort'),
    })
  }

  const activePreset = PRESETS.find(
    (p) => filter.from === daysAgo(p.days) && filter.to === daysAgo(0),
  )?.label

  return (
    // key: URL이 바뀌면(초기화·작성자 클릭 등) 입력칸 기본값도 새로 채운다
    <form
      key={JSON.stringify(filter)}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-b border-stone-100 p-4 md:p-5"
      aria-label={`${mode === 'reviews' ? '리뷰' : '신고'} 검색 필터`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-500">
          병원
          <select name="hospitalId" defaultValue={filter.hospitalId ?? ''} className="admin-input">
            <option value="">{hospitals.length > 1 ? '전체 병원' : '전체'}</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-500">
          작성자 이메일
          <input
            name="author"
            defaultValue={filter.author ?? ''}
            placeholder="일부만 입력해도 됩니다"
            className="admin-input"
          />
        </label>
        {mode === 'reports' && (
          <label className="flex flex-col gap-1 text-xs font-semibold text-stone-500">
            신고자 이메일
            <input
              name="reporter"
              defaultValue={filter.reporter ?? ''}
              placeholder="일부만 입력해도 됩니다"
              className="admin-input"
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-500">
          상태
          <select
            name="hidden"
            defaultValue={filter.hidden === undefined ? '' : String(filter.hidden)}
            className="admin-input"
          >
            <option value="">전체</option>
            <option value="false">노출중</option>
            <option value="true">숨김</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-500">
          정렬
          <select name="sort" defaultValue={filter.sort ?? ''} className="admin-input">
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-semibold text-stone-500">{dateLabel} 기간</legend>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              name="from"
              aria-label={`${dateLabel} 시작`}
              defaultValue={filter.from ?? ''}
              className="admin-input"
            />
            <span className="text-stone-400">~</span>
            <input
              type="date"
              name="to"
              aria-label={`${dateLabel} 끝`}
              defaultValue={filter.to ?? ''}
              className="admin-input"
            />
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={activePreset === preset.label}
                onClick={() => onChange({ ...filter, from: daysAgo(preset.days), to: daysAgo(0) })}
                className={`admin-btn ${
                  activePreset === preset.label
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => onChange({})} className="admin-btn-secondary">
            초기화
          </button>
          <button type="submit" className="admin-btn-primary">
            <MagnifyingGlass size={16} />
            검색
          </button>
        </div>
      </div>
    </form>
  )
}
