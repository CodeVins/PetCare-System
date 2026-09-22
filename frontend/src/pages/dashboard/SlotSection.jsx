import { CalendarBlank } from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'
import { createSlot, getSlots } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import TextField from '../../components/common/TextField'
import { formatDateLabel, formatTimeRange } from '../../lib/format'

function groupByDate(slots) {
  const groups = new Map()
  for (const slot of slots) {
    const dateKey = slot.startTime.slice(0, 10)
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey).push(slot)
  }
  return Array.from(groups.entries())
}

export default function SlotSection({ hospitalId }) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '' })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const loadSlots = useCallback(() => {
    setLoading(true)
    setError('')
    getSlots(hospitalId)
      .then(({ data }) => setSlots(data.data.content))
      .catch((err) => setError(err.response?.data?.message || '슬롯을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [hospitalId])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!newSlot.startTime || !newSlot.endTime) {
      setFormError('시작/종료 시간을 입력해 주세요.')
      return
    }
    if (newSlot.endTime <= newSlot.startTime) {
      setFormError('종료 시간은 시작 시간보다 뒤여야 합니다.')
      return
    }
    setCreating(true)
    try {
      await createSlot(hospitalId, newSlot)
      setNewSlot({ startTime: '', endTime: '' })
      loadSlots()
    } catch (err) {
      setFormError(err.response?.data?.message || '슬롯 등록에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="card flex flex-col gap-3 p-5 md:p-6"
        aria-labelledby="h-slot-form"
      >
        <h2 id="h-slot-form" className="h-section">
          슬롯 등록
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="시작"
            type="datetime-local"
            value={newSlot.startTime}
            onChange={(event) => setNewSlot((s) => ({ ...s, startTime: event.target.value }))}
          />
          <TextField
            label="종료"
            type="datetime-local"
            value={newSlot.endTime}
            onChange={(event) => setNewSlot((s) => ({ ...s, endTime: event.target.value }))}
          />
        </div>
        <Alert tone="error">{formError}</Alert>
        <Button type="submit" loading={creating} className="w-full">
          슬롯 등록
        </Button>
      </form>

      {loading && <div className="h-32 animate-pulse rounded-2xl bg-stone-100" />}
      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && slots.length === 0 && (
        <div className="card">
          <EmptyState icon={CalendarBlank}>등록된 슬롯이 없습니다.</EmptyState>
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="card flex flex-col gap-4 p-5 md:p-6">
          {groupByDate(slots).map(([dateKey, dateSlots]) => (
            <div key={dateKey}>
              <p className="mb-2 text-[13px] font-bold text-stone-600">
                {formatDateLabel(dateKey)}
              </p>
              <div className="flex flex-wrap gap-2">
                {dateSlots.map((slot) => (
                  <span
                    key={slot.id}
                    className={`chip cursor-default ${
                      slot.status === 'AVAILABLE'
                        ? ''
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-100'
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
  )
}
