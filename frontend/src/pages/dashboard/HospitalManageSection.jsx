import { useEffect, useState } from 'react'
import { createSlot, getSlots, updateHospital } from '../../api/hospitalApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

function toFormState(hospital) {
  return {
    name: hospital.name,
    address: hospital.address || '',
    latitude: hospital.latitude ?? '',
    longitude: hospital.longitude ?? '',
    openingHours: hospital.openingHours || '',
    specialty: hospital.specialty || '',
  }
}

function formatDateLabel(dateOnly) {
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatTimeRange(startTime, endTime) {
  const format = (value) =>
    new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return `${format(startTime)} - ${format(endTime)}`
}

function groupByDate(slots) {
  const groups = new Map()
  for (const slot of slots) {
    const dateKey = slot.startTime.slice(0, 10)
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey).push(slot)
  }
  return Array.from(groups.entries())
}

export default function HospitalManageSection({ hospital, onHospitalUpdated }) {
  const [form, setForm] = useState(toFormState(hospital))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [slotsError, setSlotsError] = useState('')
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '' })
  const [creatingSlot, setCreatingSlot] = useState(false)
  const [slotFormError, setSlotFormError] = useState('')

  const loadSlots = () => {
    setSlotsLoading(true)
    setSlotsError('')
    getSlots(hospital.id)
      .then(({ data }) => setSlots(data.data.content))
      .catch((err) =>
        setSlotsError(err.response?.data?.message || '슬롯을 불러오지 못했습니다.'),
      )
      .finally(() => setSlotsLoading(false))
  }

  useEffect(() => {
    setForm(toFormState(hospital))
    setFormSuccess(false)
    loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospital.id])

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
      })
      onHospitalUpdated(data.data)
      setFormSuccess(true)
    } catch (err) {
      setFormError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSlotSubmit = async (event) => {
    event.preventDefault()
    setSlotFormError('')
    if (!newSlot.startTime || !newSlot.endTime) {
      setSlotFormError('시작/종료 시간을 입력해주세요.')
      return
    }
    setCreatingSlot(true)
    try {
      await createSlot(hospital.id, newSlot)
      setNewSlot({ startTime: '', endTime: '' })
      loadSlots()
    } catch (err) {
      setSlotFormError(err.response?.data?.message || '슬롯 등록에 실패했습니다.')
    } finally {
      setCreatingSlot(false)
    }
  }

  const slotsByDate = groupByDate(slots)

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleFormSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
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

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {formSuccess && <p className="text-sm text-brand-700">저장되었습니다.</p>}

        <Button type="submit" loading={saving} className="w-full">
          병원 정보 저장
        </Button>
      </form>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-stone-700">예약 슬롯</h3>

        <form
          onSubmit={handleSlotSubmit}
          className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="시작 시간"
              type="datetime-local"
              value={newSlot.startTime}
              onChange={(event) =>
                setNewSlot((s) => ({ ...s, startTime: event.target.value }))
              }
            />
            <TextField
              label="종료 시간"
              type="datetime-local"
              value={newSlot.endTime}
              onChange={(event) => setNewSlot((s) => ({ ...s, endTime: event.target.value }))}
            />
          </div>
          {slotFormError && <p className="text-sm text-red-600">{slotFormError}</p>}
          <Button type="submit" loading={creatingSlot} className="w-full">
            슬롯 등록
          </Button>
        </form>

        {slotsLoading && <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />}
        {!slotsLoading && slotsError && <p className="text-sm text-red-600">{slotsError}</p>}
        {!slotsLoading && !slotsError && slots.length === 0 && (
          <p className="rounded-2xl border border-dashed border-stone-300 py-10 text-center text-sm text-stone-500">
            등록된 슬롯이 없습니다.
          </p>
        )}
        {!slotsLoading && !slotsError && slots.length > 0 && (
          <div className="space-y-4">
            {slotsByDate.map(([dateKey, dateSlots]) => (
              <div key={dateKey}>
                <p className="mb-2 text-xs font-semibold text-stone-500">
                  {formatDateLabel(dateKey)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {dateSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className={`rounded-full border px-3.5 py-2 text-sm font-medium ${
                        slot.status === 'AVAILABLE'
                          ? 'border-stone-200 text-stone-700'
                          : 'border-stone-200 bg-stone-100 text-stone-400'
                      }`}
                    >
                      {formatTimeRange(slot.startTime, slot.endTime)}
                      {slot.status === 'RESERVED' && ' · 예약됨'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
