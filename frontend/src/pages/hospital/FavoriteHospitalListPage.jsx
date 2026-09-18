import { Heart } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getFavorites, removeFavorite } from '../../api/hospitalApi'
import HospitalCard from './HospitalCard'

export default function FavoriteHospitalListPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getFavorites()
      .then(({ data }) => setHospitals(data.data.content))
      .catch((err) =>
        setError(err.response?.data?.message || '즐겨찾기 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (hospitalId) => {
    setHospitals((prev) => prev.filter((hospital) => hospital.id !== hospitalId))
    try {
      await removeFavorite(hospitalId)
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-stone-900">즐겨찾기한 병원</h1>

      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && hospitals.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <Heart size={32} className="text-stone-300" />
          <p className="text-sm text-stone-500">즐겨찾기한 병원이 없습니다.</p>
        </div>
      )}

      {!loading && !error && hospitals.length > 0 && (
        <div className="space-y-3">
          {hospitals.map((hospital) => (
            <HospitalCard
              key={hospital.id}
              hospital={hospital}
              isFavorite
              onToggleFavorite={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
