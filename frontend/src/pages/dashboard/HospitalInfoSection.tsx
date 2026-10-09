import { Buildings } from '@phosphor-icons/react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { BASE_URL, errorMessage } from '../../api/axiosInstance'
import {
  deleteHospitalImage,
  updateHospital,
  uploadHospitalImage,
} from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import TextField from '../../components/common/TextField'
import Toggle from '../../components/common/Toggle'
import { useToast } from '../../hooks/useToast'
import { HOSPITAL_AMENITY_LABEL, HOSPITAL_ANIMAL_LABEL } from '../../lib/format'
import type { Hospital, HospitalAmenity, HospitalAnimal } from '../../types/api'

function toFormState(hospital: Hospital) {
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
    // 변경(2026-10-09): 전화번호·소개·진료 동물·편의 서비스 (이전: 없음 — 수정 API가 전체 교체라 폼에 없으면 저장 때 지워짐)
    phone: hospital.phone || '',
    description: hospital.description || '',
    animals: hospital.animals ?? [],
    amenities: hospital.amenities ?? [],
  }
}

const ANIMALS = Object.keys(HOSPITAL_ANIMAL_LABEL) as HospitalAnimal[]
const AMENITIES = Object.keys(HOSPITAL_AMENITY_LABEL) as HospitalAmenity[]

// 체크하면 추가, 해제하면 제거 — 순서는 라벨 정의 순서로 맞춰 둠
function toggleIn<T extends string>(list: T[], value: T, order: T[]): T[] {
  const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  return order.filter((v) => next.includes(v))
}

interface HospitalInfoSectionProps {
  hospital: Hospital
  onHospitalUpdated: (hospital: Hospital) => void
}

export default function HospitalInfoSection({ hospital, onHospitalUpdated }: HospitalInfoSectionProps) {
  const [form, setForm] = useState(toFormState(hospital))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const toast = useToast()

  const [imageSaving, setImageSaving] = useState(false)
  const [imageError, setImageError] = useState('')

  useEffect(() => {
    setForm(toFormState(hospital))
    // 선택한 병원이 바뀌면 폼도 그 병원 값으로 갈아끼운다
  }, [hospital])

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
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
        phone: form.phone.trim() || null,
        description: form.description.trim() || null,
        animals: form.animals,
        amenities: form.amenities,
      })
      onHospitalUpdated(data.data)
      // 변경(2026-09-27): 저장 완료 안내를 토스트로 (이전: 폼 아래 초록 Alert)
      toast('병원 정보를 저장했어요.')
    } catch (err) {
      setFormError(errorMessage(err, '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImageError('')
    setImageSaving(true)
    try {
      const { data } = await uploadHospitalImage(hospital.id, file)
      onHospitalUpdated(data.data)
    } catch (err) {
      setImageError(errorMessage(err, '이미지 업로드에 실패했습니다.'))
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
      setImageError(errorMessage(err, '삭제에 실패했습니다.'))
    } finally {
      setImageSaving(false)
    }
  }

  const switchRow = (key: 'is24Hours' | 'hasParking', label: string) => (
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
    <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
      <div className="admin-card flex flex-col items-center gap-2 p-4">
        <label className="group relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-brand-100 text-brand-600">
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

      <form onSubmit={handleFormSubmit} className="admin-card flex flex-col gap-4 p-5">
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
          label="운영 안내"
          hint="점심시간·공휴일 휴무 같은 안내 문구 — 요일별 진료 시간은 아래에서 설정해요."
          value={form.openingHours}
          onChange={(event) => setForm((f) => ({ ...f, openingHours: event.target.value }))}
          placeholder="예: 점심시간 13:00~14:00, 공휴일 휴무"
        />
        <TextField
          label="진료과목"
          value={form.specialty}
          onChange={(event) => setForm((f) => ({ ...f, specialty: event.target.value }))}
          placeholder="예: 내과, 외과"
        />
        <TextField
          label="전화번호"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
          placeholder="예: 02-123-4567"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hospital-description" className="text-sm font-medium text-stone-700">
            병원 소개 <span className="font-normal text-stone-500">({form.description.length}/500)</span>
          </label>
          <textarea
            id="hospital-description"
            value={form.description}
            maxLength={500}
            rows={3}
            onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
            placeholder="병원 상세 화면 맨 위에 보이는 소개 문구"
            className="input min-h-24 py-3"
          />
        </div>

        {/* 진료 동물·편의 서비스 — 목록 필터와 상세 배지에 쓰임 */}
        {(
          [
            ['진료 동물', ANIMALS, HOSPITAL_ANIMAL_LABEL, 'animals'],
            ['편의 서비스', AMENITIES, HOSPITAL_AMENITY_LABEL, 'amenities'],
          ] as const
        ).map(([legend, values, labels, key]) => (
          <fieldset key={key}>
            <legend className="mb-2 text-sm font-medium text-stone-700">{legend}</legend>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const list = form[key] as string[]
                const checked = list.includes(value)
                return (
                  <label
                    key={value}
                    className={`admin-btn cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 ${
                      checked ? 'bg-stone-900 text-white' : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          [key]: toggleIn(f[key] as string[], value, values as readonly string[] as string[]),
                        }))
                      }
                      className="sr-only"
                    />
                    {(labels as Record<string, string>)[value]}
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}

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

        {/* 변경(2026-09-30): 병원 관리 콘솔(관리자 톤)로 옮기면서 pill Button·card → admin-btn-primary·admin-card, 사진/폼 2열 (이전: 소비자 앱 톤 1열) */}
        <button type="submit" disabled={saving} className="admin-btn-primary h-10 w-full">
          {saving ? '저장 중...' : '병원 정보 저장'}
        </button>
      </form>
    </div>
  )
}
