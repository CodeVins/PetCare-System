import { Buildings } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { errorMessage } from '../../api/axiosInstance'
import { getOwnedHospitals } from '../../api/userApi'
import Alert from '../../components/common/Alert'
import type { Hospital } from '../../types/api'
import AdminLayout from '../admin/AdminLayout'
import { OWNER_NAV } from '../admin/adminNav'

export interface OwnerContext {
  hospitals: Hospital[]
  hospital: Hospital // 사이드바에서 고른 병원 (현황·슬롯·병원 정보 화면 기준)
  onHospitalUpdated: (hospital: Hospital) => void
}

export function useOwnerHospital() {
  return useOutletContext<OwnerContext>()
}

// 병원 소유자 전용 관리 콘솔 쉘 — 관리자 패널과 같은 AdminLayout(어두운 사이드바·표 위주)을 쓰고,
// "관리할 병원"은 서버가 소유자로 지정한 병원만 준다(GET /api/users/me/hospitals).
// 예약·리뷰·신고 목록은 서버가 본인 병원으로 스코핑하므로 병원 선택과 무관하게 전체가 보인다.
export default function OwnerLayout() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOwnedHospitals()
      .then(({ data }) => {
        setHospitals(data.data)
        setSelectedId(data.data[0]?.id ?? null)
      })
      .catch((err) => setError(errorMessage(err, '관리할 병원을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [])

  const hospital = hospitals.find((h) => h.id === selectedId)

  const handleHospitalUpdated = (updated: Hospital) =>
    setHospitals((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))

  const hospitalPicker =
    hospitals.length > 1 ? (
      <label className="flex flex-col gap-1 text-xs font-medium text-stone-400">
        관리할 병원
        <select
          value={selectedId ?? ''}
          onChange={(event) => setSelectedId(Number(event.target.value))}
          className="h-9 rounded-lg border border-stone-700 bg-stone-800 px-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </label>
    ) : hospital ? (
      <div className="flex items-center gap-2 rounded-lg bg-stone-800 px-3 py-2 text-sm text-white">
        <Buildings size={18} className="shrink-0 text-brand-500" />
        <span className="truncate font-medium">{hospital.name}</span>
      </div>
    ) : null

  let fallback = null
  if (loading) fallback = <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
  else if (error) fallback = <Alert tone="error">{error}</Alert>
  else if (!hospital)
    fallback = (
      <div className="admin-card flex flex-col items-center gap-2 p-10 text-center">
        <Buildings size={36} className="text-stone-400" />
        <p className="font-bold text-stone-800">관리 중인 병원이 없습니다</p>
        <p className="text-sm text-stone-500">
          관리자가 병원 소유자로 지정하면 여기서 예약·리뷰·병원 정보를 관리할 수 있어요.
        </p>
      </div>
    )

  const context: OwnerContext | undefined = hospital && {
    hospitals,
    hospital,
    onHospitalUpdated: handleHospitalUpdated,
  }

  return (
    <AdminLayout
      nav={OWNER_NAV}
      panelName="병원 관리"
      sidebarExtra={hospitalPicker}
      outletContext={context}
    >
      {fallback}
    </AdminLayout>
  )
}
