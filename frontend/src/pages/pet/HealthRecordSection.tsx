import {
  ChartLineUp,
  ClipboardText,
  Drop,
  ForkKnife,
  Note,
  PencilSimple,
  PersonSimpleWalk,
  Stethoscope,
  Syringe,
  Trash,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import {
  createHealthRecord,
  deleteHealthRecord,
  getHealthRecords,
  updateHealthRecord,
} from '../../api/healthRecordApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import SelectField from '../../components/common/SelectField'
import TextField from '../../components/common/TextField'
import { formatDateLabel } from '../../lib/format'
import WeightChart from './WeightChart'

const TYPE_LABEL = {
  WEIGHT: '체중',
  VACCINATION: '예방접종',
  TREATMENT: '진료',
  WALK: '산책',
  MEAL: '식사',
  EXCRETION: '배변',
  HEALTH_CHECK: '자가문진',
}

const TYPE_ICON = {
  WEIGHT: ChartLineUp,
  VACCINATION: Syringe,
  TREATMENT: Stethoscope,
  WALK: PersonSimpleWalk,
  MEAL: ForkKnife,
  EXCRETION: Drop,
  HEALTH_CHECK: ClipboardText,
}

const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))

const EMPTY_FORM = {
  type: 'WEIGHT',
  recordedAt: '',
  content: '',
  weight: '',
  nextDueDate: '',
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
}

export default function HealthRecordSection({ petId }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getHealthRecords(petId)
      .then(({ data }) => setRecords(sortByDateDesc(data.data.content)))
      .catch((err) =>
        setError(err.response?.data?.message || '건강기록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [petId])

  const startEdit = (record) => {
    setEditingId(record.id)
    setForm({
      type: record.type,
      recordedAt: record.recordedAt,
      content: record.content,
      weight: record.weight ?? '',
      nextDueDate: record.nextDueDate ?? '',
    })
    setFormError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setSaving(true)
    const payload = {
      type: form.type,
      recordedAt: form.recordedAt,
      content: form.content,
      weight: form.weight === '' ? null : Number(form.weight),
      nextDueDate: form.nextDueDate || null,
    }
    try {
      if (editingId) {
        const { data } = await updateHealthRecord(petId, editingId, payload)
        setRecords((prev) =>
          sortByDateDesc(
            prev.map((record) => (record.id === editingId ? data.data : record)),
          ),
        )
      } else {
        const { data } = await createHealthRecord(petId, payload)
        setRecords((prev) => sortByDateDesc([...prev, data.data]))
      }
      cancelEdit()
    } catch (err) {
      setFormError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (recordId) => {
    if (!window.confirm('건강기록을 삭제할까요?')) return
    try {
      await deleteHealthRecord(petId, recordId)
      setRecords((prev) => prev.filter((record) => record.id !== recordId))
      if (editingId === recordId) cancelEdit()
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.')
    }
  }

  const weightRecords = records
    .filter((record) => record.type === 'WEIGHT' && record.weight != null)
    .slice()
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))

  return (
    <div className="flex flex-col gap-4">
      <WeightChart records={weightRecords} />

      <form
        onSubmit={handleSubmit}
        className="card flex flex-col gap-4 p-5 md:p-6"
        aria-labelledby="h-record-form"
      >
        <h2 id="h-record-form" className="h-section">
          {editingId ? '기록 수정' : '기록 추가'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="종류"
            value={form.type}
            options={TYPE_OPTIONS}
            onChange={(event) => setForm((f) => ({ ...f, type: event.target.value }))}
          />
          <TextField
            label="날짜"
            type="date"
            value={form.recordedAt}
            onChange={(event) => setForm((f) => ({ ...f, recordedAt: event.target.value }))}
            required
          />
        </div>

        <TextField
          label="내용"
          value={form.content}
          onChange={(event) => setForm((f) => ({ ...f, content: event.target.value }))}
          placeholder="예: 5종 종합백신 접종"
          required
        />

        <TextField
          label="체중"
          type="number"
          step="0.1"
          min="0"
          hint="kg · 선택 항목입니다."
          value={form.weight}
          onChange={(event) => setForm((f) => ({ ...f, weight: event.target.value }))}
        />

        {form.type === 'VACCINATION' && (
          <TextField
            label="다음 접종 예정일"
            type="date"
            hint="입력하면 홈 화면에 D-day로 표시됩니다."
            value={form.nextDueDate}
            onChange={(event) => setForm((f) => ({ ...f, nextDueDate: event.target.value }))}
          />
        )}

        <Alert tone="error">{formError}</Alert>

        <div className="flex gap-2">
          <Button type="submit" loading={saving} className="flex-1">
            {editingId ? '기록 수정' : '기록 추가'}
          </Button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn btn-secondary">
              취소
            </button>
          )}
        </div>
      </form>

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && records.length === 0 && (
        <div className="card">
          <EmptyState icon={Note}>아직 기록이 없습니다.</EmptyState>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <ul className="flex flex-col gap-2">
          {records.map((record) => {
            const Icon = TYPE_ICON[record.type] ?? Note
            return (
              <li key={record.id} className="card flex items-start gap-3 p-4">
                <span className="icon-badge">
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <p className="font-bold">{TYPE_LABEL[record.type]}</p>
                    <p className="text-[13px] text-stone-600">
                      {formatDateLabel(record.recordedAt)}
                    </p>
                  </div>
                  <p className="mt-0.5 break-words text-[15px] text-stone-700">
                    {record.content}
                  </p>
                  {record.weight != null && (
                    <p className="mt-0.5 text-[13px] text-stone-600">{record.weight}kg</p>
                  )}
                  {record.nextDueDate && (
                    <p className="mt-1">
                      <span className="badge badge-wait">
                        다음 접종 {formatDateLabel(record.nextDueDate)}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => startEdit(record)}
                    aria-label="기록 수정"
                    className="flex size-11 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  >
                    <PencilSimple size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(record.id)}
                    aria-label="기록 삭제"
                    className="flex size-11 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
