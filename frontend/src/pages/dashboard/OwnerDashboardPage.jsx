import { Buildings } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getHospitals } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import SelectField from '../../components/common/SelectField'
import Tabs from '../../components/common/Tabs'
import ReviewSection from '../hospital/ReviewSection'
import HospitalInfoSection from './HospitalInfoSection'
import ReservationQueueSection from './ReservationQueueSection'
import SlotSection from './SlotSection'

const TABS = [
  { value: 'reservations', label: '예약 관리' },
  { value: 'hospital', label: '병원 정보' },
  { value: 'slots', label: '예약 슬롯' },
  { value: 'reviews', label: '리뷰 답글' },
]

export default function OwnerDashboardPage() {
  const [hospitals, setHospitals] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('reservations')

  useEffect(() => {
    getHospitals()
      .then(({ data }) => {
        setHospitals(data.data)
        if (data.data.length > 0) setSelectedId(String(data.data[0].id))
      })
      .catch((err) =>
        setError(err.response?.data?.message || '병원 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const selectedHospital = hospitals.find((h) => String(h.id) === selectedId) || null

  const handleHospitalUpdated = (updated) => {
    setHospitals((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))
  }

  const needsHospital = tab !== 'reservations'

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between">
        <PageHeader title="대시보드" />
        <div className="flex items-center gap-3 md:mb-6 md:min-w-[320px]">
          {loading ? (
            <div className="h-12 w-full animate-pulse rounded-lg bg-stone-100" />
          ) : (
            <SelectField
              label="관리할 병원"
              className="md:min-w-65"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              options={[
                { value: '', label: '병원을 선택하세요' },
                ...hospitals.map((h) => ({ value: h.id, label: h.name })),
              ]}
            />
          )}
        </div>
      </div>

      <Alert tone="error" className="mb-4">
        {error}
      </Alert>

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="대시보드 메뉴"
        layoutId="dashboard-tab"
      />

      {tab === 'reservations' && <ReservationQueueSection />}

      {needsHospital && !selectedHospital && !loading && (
        <div className="card">
          <EmptyState icon={Buildings}>
            먼저 위에서 관리할 병원을 선택해 주세요.
          </EmptyState>
        </div>
      )}

      {selectedHospital && tab === 'hospital' && (
        <>
          <p className="mb-3 text-[13px] text-stone-600">
            목록에는 등록된 모든 병원이 뜨지만, 실제 저장/슬롯 등록은 관리 권한이 있는
            병원에서만 됩니다.
          </p>
          <HospitalInfoSection
            hospital={selectedHospital}
            onHospitalUpdated={handleHospitalUpdated}
          />
        </>
      )}

      {selectedHospital && tab === 'slots' && (
        <SlotSection hospitalId={selectedHospital.id} />
      )}

      {selectedHospital && tab === 'reviews' && (
        <ReviewSection
          key={selectedHospital.id}
          hospitalId={selectedHospital.id}
          isManager
          canWrite={false}
          averageRating={selectedHospital.averageRating}
          reviewCount={selectedHospital.reviewCount}
        />
      )}
    </div>
  )
}
