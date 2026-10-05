import { X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { getTreatmentRecord, saveTreatmentRecord } from '../../api/reservationAdminApi'
import Alert from '../../components/common/Alert'
import TextField from '../../components/common/TextField'
import { formatSlot, reservationPetCaption } from '../../lib/format'
import type { Reservation } from '../../types/api'

interface TreatmentRecordDialogProps {
  reservation: Reservation
  onClose: () => void
  onSaved: () => void
}

const TYPES = [
  { value: 'TREATMENT', label: '진료' },
  { value: 'VACCINATION', label: '접종' },
] as const

// 진료 후 병원이 남기는 기록 — 저장하면 보호자의 건강 기록에 "병원 작성"으로 들어가고,
// 다음 예정일을 넣으면 D-3부터 보호자에게 리마인더가 간다. 예약당 1개라 열 때 기존 기록을 불러와 수정.
export default function TreatmentRecordDialog({ reservation, onClose, onSaved }: TreatmentRecordDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [type, setType] = useState<'TREATMENT' | 'VACCINATION'>(
    reservation.type === 'VACCINATION' ? 'VACCINATION' : 'TREATMENT',
  )
  const [content, setContent] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
    getTreatmentRecord(reservation.id)
      .then(({ data }) => {
        const record = data.data
        if (!record) return
        setExisting(true)
        setType(record.type === 'VACCINATION' ? 'VACCINATION' : 'TREATMENT')
        setContent(record.content)
        setNextDueDate(record.nextDueDate ?? '')
      })
      .catch((err) => setError(errorMessage(err, '기존 기록을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [reservation.id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!content.trim()) {
      setError('진료 내용을 입력해 주세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveTreatmentRecord(reservation.id, {
        type,
        content: content.trim(),
        nextDueDate: nextDueDate || null,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(errorMessage(err, '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  // 서버는 진료일 다음 날부터 허용
  const minNextDate = (() => {
    const date = new Date(reservation.startTime)
    date.setDate(date.getDate() + 1)
    return date.toLocaleDateString('sv-SE')
  })()

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="treatment-dialog"
      className="m-auto w-full max-w-lg rounded-2xl bg-white p-0 text-stone-900 shadow-lg backdrop:bg-stone-900/40"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="treatment-dialog" className="text-lg font-bold">
              {existing ? '진료 기록 수정' : '진료 기록 작성'}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {reservationPetCaption(reservation)} · {formatSlot(reservation)}
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

        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-stone-100" />
        ) : (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-stone-700">종류</legend>
              <div className="flex gap-2">
                {TYPES.map((option) => (
                  <label
                    key={option.value}
                    className={`admin-btn cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 ${
                      type === option.value
                        ? 'bg-stone-900 text-white'
                        : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="treatment-type"
                      value={option.value}
                      checked={type === option.value}
                      onChange={() => setType(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="treatment-content" className="text-sm font-medium text-stone-700">
                진단 · 처방 내용
              </label>
              <textarea
                id="treatment-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={255}
                rows={4}
                placeholder="예) 외이염 진료, 귀 세정 후 연고 처방(1일 2회, 7일)"
                className="input min-h-28 py-3"
                required
              />
              <span className="self-end text-xs text-stone-500">{content.length}/255</span>
            </div>

            <TextField
              label={type === 'VACCINATION' ? '다음 접종 예정일 (선택)' : '다음 내원 예정일 (선택)'}
              type="date"
              min={minNextDate}
              value={nextDueDate}
              onChange={(event) => setNextDueDate(event.target.value)}
            />
            <p className="-mt-3 text-xs text-stone-500">
              입력하면 보호자에게 예정일 3일 전부터 알림이 갑니다.
            </p>
          </>
        )}

        <Alert tone="error">{error}</Alert>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="admin-btn-secondary">
            취소
          </button>
          <button type="submit" disabled={loading || saving} className="admin-btn-primary">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
