import { Buildings } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { BASE_URL } from '../../api/axiosInstance'
import {
  deleteHospitalImage,
  updateHospital,
  uploadHospitalImage,
} from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import Toggle from '../../components/common/Toggle'

function toFormState(hospital) {
  return {
    name: hospital.name,
    address: hospital.address || '',
    latitude: hospital.latitude ?? '',
    longitude: hospital.longitude ?? '',
    openingHours: hospital.openingHours || '',
    specialty: hospital.specialty || '',
    is24Hours: hospital.is24Hours || false,
    hasParking: hospital.hasParking || false,
    avgTreatmentPrice: hospital.avgTreatmentPrice ?? '',
  }
}

export default function HospitalInfoSection({ hospital, onHospitalUpdated }) {
  const [form, setForm] = useState(toFormState(hospital))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  const [imageSaving, setImageSaving] = useState(false)
  const [imageError, setImageError] = useState('')

  useEffect(() => {
    setForm(toFormState(hospital))
    setFormSuccess(false)
    // 선택한 병원이 바뀌면 폼도 그 병원 값으로 갈아끼운다
  }, [hospital])

  const handleFormSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setFormSuccess(false)
    setSaving(true)
    try {
      const { data } = await updateHospital(hospital.id, {
        name: form.name,
        address: form.address || null,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        openingHours: form.openingHours || null,
        specialty: form.specialty || null,
        is24Hours: form.is24Hours,
        hasParking: form.hasParking,
        avgTreatmentPrice:
          form.avgTreatmentPrice === '' ? null : Number(form.avgTreatmentPrice),
      })
      onHospitalUpdated(data.data)
      setFormSuccess(true)
    } catch (err) {
      setFormError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImageError('')
    setImageSaving(true)
    try {
      const { data } = await uploadHospitalImage(hospital.id, file)
      onHospitalUpdated(data.data)
    } catch (err) {
      setImageError(err.response?.data?.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setImageSaving(false)
    }
  }

  const handleImageDelete = async () => {
    if (!window.confirm('병원 사진을 삭제할까요?')) return
    setImageError('')
    setImageSaving(true)
    try {
      await deleteHospitalImage(hospital.id)
      onHospitalUpdated({ ...hospital, imageUrl: null })
    } catch (err) {
      setImageError(err.response?.data?.message || '삭제에 실패했습니다.')
    } finally {
      setImageSaving(false)
    }
  }

  const switchRow = (key, label) => (
    <div className="flex items-center gap-3 border-b border-stone-100 py-3 last:border-0">
      <span id={`hospital-${key}`} className="flex-1 font-medium">
        {label}
      </span>
      <Toggle
        checked={form[key]}
        labelledBy={`hospital-${key}`}
        onChange={(next) => setForm((f) => ({ ...f, [key]: next }))}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <label className="group relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-brand-100 text-brand-600">
          {hospital.imageUrl ? (
            <img
              src={`${BASE_URL}${hospital.imageUrl}`}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Buildings size={40} />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {imageSaving ? '처리 중...' : '사진 변경'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={imageSaving}
            onChange={handleImageChange}
          />
        </label>
        {imageError && <p className="text-[13px] text-red-600">{imageError}</p>}
        {hospital.imageUrl && (
          <button
            type="button"
            onClick={handleImageDelete}
            disabled={imageSaving}
            className="text-[13px] font-medium text-stone-600 hover:text-red-600 disabled:opacity-50"
          >
            사진 삭제
          </button>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="card flex flex-col gap-4 p-5 md:p-6">
        <TextField
          label="병원 이름"
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          required
        />
        <TextField
          label="주소"
          value={form.address}
          onChange={(event) => setForm((f) => ({ ...f, address: event.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="위도"
            type="number"
            step="0.000001"
            value={form.latitude}
            onChange={(event) => setForm((f) => ({ ...f, latitude: event.target.value }))}
          />
          <TextField
            label="경도"
            type="number"
            step="0.000001"
            value={form.longitude}
            onChange={(event) => setForm((f) => ({ ...f, longitude: event.target.value }))}
          />
        </div>
        <TextField
          label="운영시간"
          value={form.openingHours}
          onChange={(event) => setForm((f) => ({ ...f, openingHours: event.target.value }))}
          placeholder="예: 평일 09:00-18:00"
        />
        <TextField
          label="진료과목"
          value={form.specialty}
          onChange={(event) => setForm((f) => ({ ...f, specialty: event.target.value }))}
          placeholder="예: 내과, 외과"
        />

        <div>
          {switchRow('is24Hours', '24시간 운영')}
          {switchRow('hasParking', '주차 가능')}
        </div>

        <TextField
          label="평균 진료비"
          type="number"
          step="1000"
          min="0"
          hint="원 · 선택 항목입니다."
          value={form.avgTreatmentPrice}
          onChange={(event) =>
            setForm((f) => ({ ...f, avgTreatmentPrice: event.target.value }))
          }
        />

        <Alert tone="error">{formError}</Alert>
        {formSuccess && <Alert tone="ok">병원 정보를 저장했어요.</Alert>}

        <Button type="submit" loading={saving} className="w-full">
          병원 정보 저장
        </Button>
      </form>
    </div>
  )
}
