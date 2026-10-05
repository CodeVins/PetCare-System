import AdminPageHeader from '../admin/AdminPageHeader'
import HospitalInfoSection from './HospitalInfoSection'
import OpeningHoursEditor from './OpeningHoursEditor'
import { useOwnerHospital } from './OwnerLayout'

export default function OwnerHospitalPage() {
  const { hospital, onHospitalUpdated } = useOwnerHospital()
  return (
    <div>
      <AdminPageHeader title="병원 정보" description="병원 목록·상세 화면에 보이는 정보와 사진을 수정합니다" />
      <HospitalInfoSection hospital={hospital} onHospitalUpdated={onHospitalUpdated} />
      <OpeningHoursEditor key={hospital.id} hospital={hospital} onHospitalUpdated={onHospitalUpdated} />
    </div>
  )
}
