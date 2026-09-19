import { Syringe } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUpcomingVaccinations } from '../api/userApi'
import { Reveal, RevealItem } from '../components/common/Reveal'

function formatDday(daysRemaining) {
  if (daysRemaining === 0) return 'D-DAY'
  if (daysRemaining < 0) return `D+${Math.abs(daysRemaining)}`
  return `D-${daysRemaining}`
}

export default function HomePage() {
  const [vaccinations, setVaccinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUpcomingVaccinations()
      .then(({ data }) => setVaccinations(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || '예정 접종 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">홈</h1>
        <p className="mt-1 text-sm text-stone-500">다가오는 접종 일정을 확인하세요.</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && vaccinations.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <Syringe size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">예정된 접종이 없습니다.</p>
        </div>
      )}

      {!loading && !error && vaccinations.length > 0 && (
        <Reveal className="space-y-2" stagger={0.06}>
          {vaccinations.map((item) => (
            <RevealItem key={item.healthRecordId}>
              <Link
                to={`/pets/${item.petId}`}
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <Syringe weight="fill" size={20} className="text-brand-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-900">{item.petName}</p>
                  <p className="text-sm text-stone-500">{item.nextDueDate}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.daysRemaining <= 7
                      ? 'bg-red-50 text-red-700'
                      : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  {formatDday(item.daysRemaining)}
                </span>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      )}
    </div>
  )
}
