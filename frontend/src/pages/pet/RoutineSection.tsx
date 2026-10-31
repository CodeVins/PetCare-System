import { CalendarBlank, PencilSimple, Repeat, Trash } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../api/axiosInstance'
import { createRoutine, deleteRoutine, getRoutines, updateRoutine } from '../../api/petApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import TextField from '../../components/common/TextField'
import { useToast } from '../../hooks/useToast'
import { formatDateLabel } from '../../lib/format'
import { WEEK } from '../../lib/openingHours'
import type { DayOfWeek, HealthRecordType, Routine, RoutinePayload } from '../../types/api'
import { RECORD_TYPES, ROUTINE_TYPES } from './healthRecordTypes'

const todayIso = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const EMPTY_FORM: RoutinePayload = {
  type: 'WALK',
  title: '',
  time: null,
  daysOfWeek: WEEK.map((w) => w.day),
  startDate: '',
  endDate: null,
}

// "매일 · 07:30", "월·수·금", "한 번 · 11월 3일 (화)" (+ 종료일)
function routineSchedule(routine: Pick<Routine, 'time' | 'daysOfWeek' | 'startDate' | 'endDate'>) {
  const days = routine.daysOfWeek
  const when =
    days.length === 0
      ? `한 번 · ${formatDateLabel(routine.startDate)}`
      : days.length === 7
        ? '매일'
        : WEEK.filter((w) => days.includes(w.day)).map((w) => w.label).join('·')
  const time = routine.time ? ` · ${routine.time.slice(0, 5)}` : ''
  const until = days.length > 0 && routine.endDate ? ` · ${formatDateLabel(routine.endDate)}까지` : ''
  return when + time + until
}

// 펫 상세 "루틴" 탭 — 반복 일정 목록 + 추가·수정 폼. 완료 체크는 캘린더에서
export default function RoutineSection({ petId }: { petId: number | string }) {
  const toast = useToast()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<RoutinePayload>(() => ({ ...EMPTY_FORM, startDate: todayIso() }))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getRoutines(petId)
      .then(({ data }) => setRoutines(data.data))
      .catch((err) => setError(errorMessage(err, '일정을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [petId])

  const set = <K extends keyof RoutinePayload>(key: K, value: RoutinePayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleDay = (day: DayOfWeek) =>
    set('daysOfWeek', form.daysOfWeek.includes(day) ? form.daysOfWeek.filter((d) => d !== day) : [...form.daysOfWeek, day])

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, startDate: todayIso() })
    setEditingId(null)
    setFormError('')
  }

  const startEdit = (routine: Routine) => {
    setEditingId(routine.id)
    setForm({
      type: routine.type,
      title: routine.title,
      time: routine.time?.slice(0, 5) ?? null,
      daysOfWeek: routine.daysOfWeek,
      startDate: routine.startDate,
      endDate: routine.endDate,
    })
    setFormError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (editingId) {
        const { data } = await updateRoutine(petId, editingId, form)
        setRoutines((prev) => prev.map((r) => (r.id === editingId ? data.data : r)))
        toast('일정을 수정했어요.')
      } else {
        const { data } = await createRoutine(petId, form)
        setRoutines((prev) => [...prev, data.data])
        toast('일정을 추가했어요. 캘린더에서 완료 체크할 수 있어요.')
      }
      resetForm()
    } catch (err) {
      setFormError(errorMessage(err, '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (routine: Routine) => {
    if (!window.confirm(`'${routine.title}' 일정을 삭제할까요? 이미 완료한 기록은 건강기록에 남아요.`)) return
    try {
      await deleteRoutine(petId, routine.id)
      setRoutines((prev) => prev.filter((r) => r.id !== routine.id))
      if (editingId === routine.id) resetForm()
      toast('일정을 삭제했어요.')
    } catch (err) {
      toast(errorMessage(err, '삭제에 실패했습니다.'), 'error')
    }
  }

  const oneTime = form.daysOfWeek.length === 0

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-5 md:p-6" aria-labelledby="h-routines">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="h-routines" className="h-section">반복 일정</h2>
          <Link to="/pets/calendar" className="flex min-h-11 items-center gap-1 text-sm font-medium text-brand-700">
            <CalendarBlank size={18} />
            캘린더에서 보기
          </Link>
        </div>

        {loading && <div className="h-16 animate-pulse rounded-xl bg-stone-100" />}
        {!loading && error && <Alert tone="error">{error}</Alert>}
        {!loading && !error && routines.length === 0 && (
          <EmptyState icon={Repeat}>매일 산책·식사·투약 같은 일정을 등록해 보세요.</EmptyState>
        )}
        {!loading && routines.length > 0 && (
          <ul className="flex flex-col">
            {routines.map((routine) => {
              const meta = RECORD_TYPES[routine.type]
              return (
                <li key={routine.id} className="flex items-center gap-3 border-b border-stone-100 py-2.5 last:border-0">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
                    <meta.icon size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-bold">{routine.title}</span>
                    <span className="text-[13px] text-stone-600">
                      {meta.label} · {routineSchedule(routine)}
                    </span>
                  </span>
                  <button type="button" onClick={() => startEdit(routine)} aria-label={`${routine.title} 수정`} className="flex size-11 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100">
                    <PencilSimple size={20} />
                  </button>
                  <button type="button" onClick={() => handleDelete(routine)} aria-label={`${routine.title} 삭제`} className="flex size-11 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-red-600">
                    <Trash size={20} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5 md:p-6" aria-labelledby="h-routine-form">
        <h2 id="h-routine-form" className="h-section">{editingId ? '일정 수정' : '일정 추가'}</h2>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-stone-800">종류</legend>
          <div className="flex flex-wrap gap-2">
            {ROUTINE_TYPES.map((type: HealthRecordType) => (
              <button key={type} type="button" aria-pressed={form.type === type} onClick={() => set('type', type)} className={`chip ${form.type === type ? 'chip-on' : ''}`}>
                {RECORD_TYPES[type].label}
              </button>
            ))}
          </div>
        </fieldset>

        <TextField
          label="이름"
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
          placeholder={RECORD_TYPES[form.type].placeholder}
          maxLength={50}
          required
        />

        <TextField
          label="시간 (선택)"
          type="time"
          value={form.time ?? ''}
          onChange={(event) => set('time', event.target.value || null)}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-stone-800">반복 요일</legend>
          <div className="flex flex-wrap gap-2">
            {WEEK.map(({ day, label }) => (
              <button key={day} type="button" aria-pressed={form.daysOfWeek.includes(day)} onClick={() => toggleDay(day)} className={`chip size-10 justify-center px-0 ${form.daysOfWeek.includes(day) ? 'chip-on' : ''}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-stone-500">
            {oneTime ? '요일을 고르지 않으면 시작일 하루만 있는 일정이에요.' : '고른 요일마다 캘린더에 나와요.'}
          </p>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label={oneTime ? '날짜' : '시작일'}
            type="date"
            value={form.startDate}
            onChange={(event) => set('startDate', event.target.value)}
            required
          />
          {!oneTime && (
            <TextField
              label="종료일 (선택)"
              type="date"
              value={form.endDate ?? ''}
              min={form.startDate}
              onChange={(event) => set('endDate', event.target.value || null)}
            />
          )}
        </div>

        <Alert tone="error">{formError}</Alert>
        <div className="flex gap-2">
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
              취소
            </Button>
          )}
          <Button type="submit" loading={saving} className="flex-1">
            {editingId ? '저장' : '추가하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
