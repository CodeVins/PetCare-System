import { X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { createRoutine } from '../../api/petApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import SelectField from '../../components/common/SelectField'
import type { Pet, RoutinePayload } from '../../types/api'
import RoutineFormFields from './RoutineFormFields'

// 캘린더에서 고른 날짜로 일정 추가 — 기본은 그날 하루(요일 없음), 요일을 고르면 그날부터 반복.
// HealthRecordDialog와 같은 네이티브 <dialog>(모바일은 아래 시트, 데스크톱은 가운데 창)
export default function RoutineDialog({
  date,
  pets,
  defaultPetId,
  onClose,
  onSaved,
}: {
  date: string
  pets: Pet[]
  defaultPetId?: number
  onClose: () => void
  onSaved: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [petId, setPetId] = useState(defaultPetId ?? pets[0]?.id)
  const [form, setForm] = useState<RoutinePayload>({
    type: 'WALK',
    title: '',
    time: null,
    daysOfWeek: [],
    startDate: date,
    endDate: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (petId == null) return
    setSaving(true)
    setError('')
    try {
      await createRoutine(petId, form)
      onSaved()
      onClose()
    } catch (err) {
      setError(errorMessage(err, '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="h-routine-dialog"
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-stone-900 shadow-lg backdrop:bg-stone-900/40 md:m-auto md:max-w-lg md:rounded-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 id="h-routine-dialog" className="text-lg font-bold">일정 추가</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="-mr-2 flex size-11 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100">
            <X size={22} />
          </button>
        </div>

        {pets.length > 1 && (
          <SelectField
            label="반려동물"
            value={String(petId)}
            options={pets.map((pet) => ({ value: String(pet.id), label: pet.name }))}
            onChange={(event) => setPetId(Number(event.target.value))}
          />
        )}

        <RoutineFormFields value={form} onChange={setForm} />

        <Alert tone="error">{error}</Alert>
        <Button type="submit" loading={saving} className="w-full">
          추가하기
        </Button>
      </form>
    </dialog>
  )
}
