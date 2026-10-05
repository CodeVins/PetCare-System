import { X } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { getSlots } from '../../api/hospitalApi'
import { rescheduleReservation } from '../../api/reservationApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import { formatDateLabel, formatSlot, formatTimeRange } from '../../lib/format'
import type { Reservation, Slot } from '../../types/api'

interface RescheduleDialogProps {
  reservation: Reservation
  onClose: () => void
  onRescheduled: (reservation: Reservation) => void
}

// 같은 병원의 다른 빈 시간으로 예약 변경 — 서버가 한 번에 슬롯을 맞바꿔서 취소 후 재예약하는 사이에
// 자리를 뺏기는 일이 없다. 변경하면 병원이 다시 확정해야 해서 "확정 대기"로 돌아간다.
export default function RescheduleDialog({ reservation, onClose, onRescheduled }: RescheduleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
    getSlots(reservation.hospitalId, 'AVAILABLE')
      .then(({ data }) => setSlots(data.data.content))
      .catch((err) => setError(errorMessage(err, '예약 가능한 시간을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [reservation.hospitalId])

  // 날짜별로 묶기 — 서버가 시작 시간 오름차순으로 내려준다
  const slotsByDate = useMemo(() => {
    const groups = new Map<string, Slot[]>()
    for (const slot of slots) {
      const date = slot.startTime.slice(0, 10)
      groups.set(date, [...(groups.get(date) ?? []), slot])
    }
    return Array.from(groups.entries())
  }, [slots])

  const handleSubmit = async () => {
    if (selectedId == null) return
    setSaving(true)
    setError('')
    try {
      const { data } = await rescheduleReservation(reservation.id, selectedId)
      onRescheduled(data.data)
      onClose()
    } catch (err) {
      setError(errorMessage(err, '예약 변경에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="reschedule-dialog"
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-stone-900 shadow-lg backdrop:bg-stone-900/40 md:m-auto md:max-w-lg md:rounded-2xl"
    >
      <div className="flex flex-col gap-4 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="reschedule-dialog" className="text-lg font-bold">
              예약 시간 변경
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {reservation.hospitalName} · 지금 {formatSlot(reservation)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100"
          >
            <X size={22} />
          </button>
        </div>

        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          시간을 바꾸면 병원이 다시 확정할 때까지 &lsquo;확정 대기&rsquo; 상태가 돼요.
        </p>

        {loading && <div className="h-40 animate-pulse rounded-xl bg-stone-100" />}
        {!loading && slots.length === 0 && !error && (
          <p className="py-6 text-center text-sm text-stone-600">지금 바꿀 수 있는 빈 시간이 없어요.</p>
        )}

        {!loading && slots.length > 0 && (
          <div className="flex max-h-[45dvh] flex-col gap-4 overflow-y-auto">
            {slotsByDate.map(([date, dateSlots]) => (
              <fieldset key={date}>
                <legend className="mb-2 text-sm font-bold text-stone-700">{formatDateLabel(date)}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {dateSlots.map((slot) => (
                    <label
                      key={slot.id}
                      className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 ${
                        selectedId === slot.id
                          ? 'border-brand-600 bg-brand-50 font-bold text-brand-700'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reschedule-slot"
                        value={slot.id}
                        checked={selectedId === slot.id}
                        onChange={() => setSelectedId(slot.id)}
                        className="sr-only"
                      />
                      {formatTimeRange(slot.startTime, slot.endTime)}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <Alert tone="error">{error}</Alert>

        <Button
          type="button"
          onClick={handleSubmit}
          loading={saving}
          disabled={selectedId == null}
          className="w-full"
        >
          이 시간으로 변경
        </Button>
      </div>
    </dialog>
  )
}
