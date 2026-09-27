import { errorMessage } from '../../api/axiosInstance'
import { CalendarBlank, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createSlot, createSlotsBulk, deleteSlot, getSlots } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import ChoiceGroup from '../../components/common/ChoiceGroup'
import EmptyState from '../../components/common/EmptyState'
import SelectField from '../../components/common/SelectField'
import TextField from '../../components/common/TextField'
import { useToast } from '../../hooks/useToast'
import { formatDateLabel, formatTimeRange } from '../../lib/format'
import type { DayOfWeek, Slot, SlotBulkPayload } from '../../types/api'

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: '월' },
  { value: 'TUESDAY', label: '화' },
  { value: 'WEDNESDAY', label: '수' },
  { value: 'THURSDAY', label: '목' },
  { value: 'FRIDAY', label: '금' },
  { value: 'SATURDAY', label: '토' },
  { value: 'SUNDAY', label: '일' },
]

const INTERVAL_OPTIONS = [15, 20, 30, 60].map((m) => ({ value: m, label: `${m}분` }))

const INITIAL_BULK: SlotBulkPayload = {
  startDate: '',
  endDate: '',
  daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  startTime: '10:00',
  endTime: '18:00',
  intervalMinutes: 30,
}

function groupByDate(slots: Slot[]) {
  const groups = new Map<string, Slot[]>()
  for (const slot of slots) {
    const dateKey = slot.startTime.slice(0, 10)
    const group = groups.get(dateKey) ?? []
    group.push(slot)
    groups.set(dateKey, group)
  }
  return Array.from(groups.entries())
}

export default function SlotSection({ hospitalId }: { hospitalId: number }) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('single')
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '' })
  const [bulk, setBulk] = useState(INITIAL_BULK)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const toast = useToast()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadSlots = useCallback(() => {
    setLoading(true)
    setError('')
    getSlots(hospitalId)
      .then(({ data }) => setSlots(data.data.content))
      .catch((err) => setError(errorMessage(err, '슬롯을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [hospitalId])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  const toggleDay = (day: DayOfWeek) =>
    setBulk((b) => ({
      ...b,
      daysOfWeek: b.daysOfWeek.includes(day)
        ? b.daysOfWeek.filter((d) => d !== day)
        : [...b.daysOfWeek, day],
    }))

  const validate = () => {
    if (mode === 'single') {
      if (!newSlot.startTime || !newSlot.endTime) return '시작/종료 시간을 입력해 주세요.'
      if (newSlot.endTime <= newSlot.startTime) return '종료 시간은 시작 시간보다 뒤여야 합니다.'
      return ''
    }
    if (!bulk.startDate || !bulk.endDate) return '기간을 입력해 주세요.'
    if (bulk.endDate < bulk.startDate) return '종료 날짜는 시작 날짜와 같거나 뒤여야 합니다.'
    if (bulk.daysOfWeek.length === 0) return '요일을 하나 이상 선택해 주세요.'
    if (bulk.endTime <= bulk.startTime) return '하루 종료 시간은 시작 시간보다 뒤여야 합니다.'
    return ''
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = validate()
    setFormError(message)
    if (message) return

    setCreating(true)
    try {
      if (mode === 'single') {
        await createSlot(hospitalId, newSlot)
        setNewSlot({ startTime: '', endTime: '' })
        toast('슬롯을 등록했어요.')
      } else {
        const { data } = await createSlotsBulk(hospitalId, bulk)
        const { created, skipped } = data.data
        // 변경(2026-09-27): 등록 결과를 폼 아래 Alert 대신 토스트로 (이전: setFormResult + <Alert tone="ok">)
        toast(
          `${created}개 등록했어요.` +
            (skipped > 0 ? ` 지난 시간이거나 기존 슬롯과 겹친 ${skipped}개는 건너뛰었어요.` : ''),
        )
      }
      loadSlots()
    } catch (err) {
      setFormError(errorMessage(err, '슬롯 등록에 실패했습니다.'))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (slot: Slot) => {
    const label = `${formatDateLabel(slot.startTime.slice(0, 10))} ${formatTimeRange(slot.startTime, slot.endTime)}`
    if (!window.confirm(`${label} 슬롯을 삭제할까요?`)) return
    setDeletingId(slot.id)
    try {
      await deleteSlot(hospitalId, slot.id)
      setSlots((prev) => prev.filter((s) => s.id !== slot.id))
      toast(`${label} 슬롯을 삭제했어요.`)
    } catch (err) {
      // 변경(2026-09-27): 삭제 실패(예약 이력 409 등)를 토스트로 (이전: 목록 위 에러 Alert)
      toast(errorMessage(err, '슬롯 삭제에 실패했습니다.'), 'error')
    } finally {
      setDeletingId(null)
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
        <ChoiceGroup
          value={mode}
          onChange={(value) => {
            setMode(value)
            setFormError('')
          }}
          options={[
            { value: 'single', label: '한 개씩' },
            { value: 'bulk', label: '반복 등록' },
          ]}
        />

        {mode === 'single' ? (
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
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="시작 날짜"
                type="date"
                value={bulk.startDate}
                onChange={(event) => setBulk((b) => ({ ...b, startDate: event.target.value }))}
              />
              <TextField
                label="종료 날짜"
                type="date"
                hint="최대 31일"
                value={bulk.endDate}
                onChange={(event) => setBulk((b) => ({ ...b, endDate: event.target.value }))}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-stone-700">요일</span>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={bulk.daysOfWeek.includes(day.value)}
                    onClick={() => toggleDay(day.value)}
                    className={`chip min-w-11 justify-center ${
                      bulk.daysOfWeek.includes(day.value) ? 'chip-on' : ''
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField
                label="하루 시작"
                type="time"
                value={bulk.startTime}
                onChange={(event) => setBulk((b) => ({ ...b, startTime: event.target.value }))}
              />
              <TextField
                label="하루 종료"
                type="time"
                value={bulk.endTime}
                onChange={(event) => setBulk((b) => ({ ...b, endTime: event.target.value }))}
              />
              <SelectField
                label="간격"
                value={bulk.intervalMinutes}
                options={INTERVAL_OPTIONS}
                onChange={(event) =>
                  setBulk((b) => ({ ...b, intervalMinutes: Number(event.target.value) }))
                }
              />
            </div>
          </>
        )}

        <Alert tone="error">{formError}</Alert>
        <Button type="submit" loading={creating} className="w-full">
          {mode === 'single' ? '슬롯 등록' : '반복 등록'}
        </Button>
      </form>

      {loading && <div className="h-32 animate-pulse rounded-2xl bg-stone-100" />}
      {!loading && error && <Alert tone="error">{error}</Alert>}

      {/* 변경(2026-09-27): 에러가 있어도 슬롯 목록은 계속 보여줌 — 삭제 실패(409 등) 메시지가 목록을 가리지 않게
          (이전: 에러가 있으면 목록 자체를 숨김, 조회 실패만 있던 시절 기준) */}
      {!loading && slots.length === 0 && !error && (
        <div className="card">
          <EmptyState icon={CalendarBlank}>등록된 슬롯이 없습니다.</EmptyState>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="card flex flex-col gap-4 p-5 md:p-6">
          {groupByDate(slots).map(([dateKey, dateSlots]) => (
            <div key={dateKey}>
              <p className="mb-2 text-[13px] font-bold text-stone-600">
                {formatDateLabel(dateKey)}
              </p>
              <div className="flex flex-wrap gap-2">
                {dateSlots.map((slot) =>
                  slot.status === 'AVAILABLE' ? (
                    <span key={slot.id} className="chip cursor-default gap-1 pr-1.5">
                      {formatTimeRange(slot.startTime, slot.endTime)}
                      <button
                        type="button"
                        onClick={() => handleDelete(slot)}
                        disabled={deletingId === slot.id}
                        aria-label={`${formatTimeRange(slot.startTime, slot.endTime)} 슬롯 삭제`}
                        className="flex size-7 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-red-700 disabled:opacity-50"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </span>
                  ) : (
                    <span
                      key={slot.id}
                      className="chip cursor-default bg-stone-100 text-stone-500 hover:bg-stone-100"
                    >
                      {formatTimeRange(slot.startTime, slot.endTime)} · 예약됨
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
