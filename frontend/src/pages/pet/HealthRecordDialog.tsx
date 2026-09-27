import { X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { createHealthRecord, updateHealthRecord } from '../../api/healthRecordApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import type { HealthRecord, HealthRecordType } from '../../types/api'
import { RECORD_TYPE_ORDER, RECORD_TYPES } from './healthRecordTypes'

interface HealthRecordDialogProps {
  petId: number | string
  // 수정할 기록 — 없으면 새로 작성
  record: HealthRecord | null
  onClose: () => void
  onSaved: (record: HealthRecord) => void
}

const today = () => new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD (로컬 날짜)

// 건강기록 작성/수정 창. 네이티브 <dialog> — Esc 닫기·포커스 가두기·배경 클릭 차단을
// 브라우저가 처리한다. 모바일은 아래에서 올라오는 시트, 데스크톱은 가운데 창.
export default function HealthRecordDialog({
  petId,
  record,
  onClose,
  onSaved,
}: HealthRecordDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // 부모가 열 때마다 key를 바꿔 새로 마운트하므로 초기값만 record에서 채우면 된다
  const [type, setType] = useState<HealthRecordType>(record?.type ?? 'WEIGHT')
  const [recordedAt, setRecordedAt] = useState(record?.recordedAt ?? today())
  const [content, setContent] = useState(record?.content ?? '')
  const [weight, setWeight] = useState(record?.weight != null ? String(record.weight) : '')
  const [nextDueDate, setNextDueDate] = useState(record?.nextDueDate ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 마운트되면 바로 모달로 연다 (닫히면 부모가 언마운트)
  useEffect(() => {
    // StrictMode(개발)에서 effect가 두 번 돌 때 이미 열린 dialog에 다시 showModal()하면 에러
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const isWeight = type === 'WEIGHT'
    const payload = {
      type,
      recordedAt,
      // 체중은 내용을 비워도 되게 — 서버는 내용이 필수라 수치로 채워 보낸다
      content: content.trim() || (isWeight ? `체중 ${weight}kg` : ''),
      weight: isWeight && weight !== '' ? Number(weight) : null,
      nextDueDate: type === 'VACCINATION' && nextDueDate ? nextDueDate : null,
    }
    if (!payload.content) {
      setError('내용을 입력해 주세요.')
      return
    }
    setSaving(true)
    try {
      const { data } = record
        ? await updateHealthRecord(petId, record.id, payload)
        : await createHealthRecord(petId, payload)
      onSaved(data.data)
      onClose()
    } catch (err) {
      setError(errorMessage(err, '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const meta = RECORD_TYPES[type]

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="h-record-dialog"
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-stone-900 shadow-lg backdrop:bg-stone-900/40 md:m-auto md:max-w-lg md:rounded-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 id="h-record-dialog" className="text-lg font-bold">
            {record ? '기록 수정' : '건강 기록 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100"
          >
            <X size={22} />
          </button>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-700">종류</legend>
          <div className="grid grid-cols-4 gap-2">
            {RECORD_TYPE_ORDER.map((value) => {
              const { label, icon: TypeIcon, tone } = RECORD_TYPES[value]
              const selected = value === type
              return (
                <label
                  key={value}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 ${
                    selected
                      ? 'border-brand-600 bg-brand-50 font-bold text-brand-700'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="record-type"
                    value={value}
                    checked={selected}
                    onChange={() => setType(value)}
                    className="sr-only"
                  />
                  <span className={`flex size-8 items-center justify-center rounded-full ${tone}`}>
                    <TypeIcon size={18} />
                  </span>
                  {label}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className={`grid gap-3 ${type === 'WEIGHT' ? 'grid-cols-2' : ''}`}>
          <TextField
            label="날짜"
            type="date"
            max={today()}
            value={recordedAt}
            onChange={(event) => setRecordedAt(event.target.value)}
            required
          />
          {type === 'WEIGHT' && (
            <TextField
              label="체중 (kg)"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              required
            />
          )}
        </div>

        <TextField
          as="textarea"
          label={type === 'WEIGHT' ? '메모 (선택)' : '내용'}
          rows={3}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={meta.placeholder}
          className="h-auto! resize-none py-3"
        />

        {type === 'VACCINATION' && (
          <TextField
            label="다음 접종 예정일 (선택)"
            type="date"
            min={recordedAt}
            hint="입력하면 반려동물 화면에 D-day로 표시되고, 3일 전부터 알림을 보내드려요."
            value={nextDueDate}
            onChange={(event) => setNextDueDate(event.target.value)}
          />
        )}

        <Alert tone="error">{error}</Alert>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            취소
          </button>
          <Button type="submit" loading={saving} className="flex-1">
            {record ? '수정 완료' : '저장'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
