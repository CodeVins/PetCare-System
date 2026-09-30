import AdminPageHeader from '../admin/AdminPageHeader'
import { useOwnerHospital } from './OwnerLayout'
import SlotSection from './SlotSection'

export default function OwnerSlotsPage() {
  const { hospital } = useOwnerHospital()
  return (
    <div>
      <AdminPageHeader
        title="예약 슬롯"
        description={`${hospital.name} · 예약 가능한 시간대를 한 개씩 또는 기간·요일로 반복 등록합니다`}
      />
      <SlotSection key={hospital.id} hospitalId={hospital.id} />
    </div>
  )
}
