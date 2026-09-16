import { Buildings, MapPin } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHospitals } from '../../api/hospitalApi'

export default function HospitalListPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getHospitals()
      .then(({ data }) => setHospitals(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || '병원 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-stone-900">병원</h1>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && hospitals.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <Buildings size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">등록된 병원이 없습니다.</p>
        </div>
      )}

      {!loading && !error && hospitals.length > 0 && (
        <div className="space-y-3">
          {hospitals.map((hospital) => (
            <Link
              key={hospital.id}
              to={`/hospitals/${hospital.id}`}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-brand-200"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50">
                <Buildings weight="fill" size={20} className="text-brand-600" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{hospital.name}</p>
                {hospital.address && (
                  <p className="flex items-center gap-1 truncate text-sm text-stone-500">
                    <MapPin size={14} />
                    {hospital.address}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
