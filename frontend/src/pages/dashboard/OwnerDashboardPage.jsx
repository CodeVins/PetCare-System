import { useEffect, useState } from 'react'
import { getHospitals } from '../../api/hospitalApi'
import HospitalManageSection from './HospitalManageSection'
import ReservationQueueSection from './ReservationQueueSection'

export default function OwnerDashboardPage() {
  const [hospitals, setHospitals] = useState([])
  const [selectedId, setSelectedId] = useState('')
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

  const selectedHospital = hospitals.find((h) => String(h.id) === selectedId) || null

  const handleHospitalUpdated = (updated) => {
    setHospitals((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-stone-900">병원 대시보드</h1>

      <ReservationQueueSection />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-700">병원 관리</h2>
        <p className="text-xs text-stone-400">
          목록에는 등록된 모든 병원이 뜨지만, 실제 저장/슬롯 등록은 내가 관리 권한이
          있는 병원에서만 됩니다.
        </p>

        {loading && <div className="h-10 animate-pulse rounded-lg bg-stone-100" />}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">관리할 병원을 선택하세요</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
        )}

        {selectedHospital && (
          <HospitalManageSection
            hospital={selectedHospital}
            onHospitalUpdated={handleHospitalUpdated}
          />
        )}
      </div>
    </div>
  )
}
