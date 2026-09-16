import { ChartLineUp, PencilSimple, Stethoscope, Syringe, Trash } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import {
  createHealthRecord,
  deleteHealthRecord,
  getHealthRecords,
  updateHealthRecord,
} from '../../api/healthRecordApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

const TYPE_LABEL = {
  WEIGHT: '체중',
  VACCINATION: '예방접종',
  TREATMENT: '진료',
}

const TYPE_ICON = {
  WEIGHT: ChartLineUp,
  VACCINATION: Syringe,
  TREATMENT: Stethoscope,
}

const EMPTY_FORM = { type: 'WEIGHT', recordedAt: '', content: '', weight: '' }

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
      .then(({ data }) => setRecords(sortByDateDesc(data.data)))
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
    }
    try {
      if (editingId) {
        const { data } = await updateHealthRecord(petId, editingId, payload)
        setRecords((prev) =>
          sortByDateDesc(prev.map((record) => (record.id === editingId ? data.data : record))),
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

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-stone-700">건강기록</h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">종류</span>
            <select
              value={form.type}
              onChange={(event) => setForm((f) => ({ ...f, type: event.target.value }))}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
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
          label="체중 (kg, 선택)"
          type="number"
          step="0.1"
          min="0"
          value={form.weight}
          onChange={(event) => setForm((f) => ({ ...f, weight: event.target.value }))}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-2">
          <Button type="submit" loading={saving} className="flex-1">
            {editingId ? '기록 수정' : '기록 추가'}
          </Button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {loading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && records.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 py-10 text-center text-sm text-stone-500">
          아직 기록이 없습니다.
        </p>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="space-y-2">
          {records.map((record) => {
            const Icon = TYPE_ICON[record.type]
            return (
              <div
                key={record.id}
                className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <Icon size={18} className="text-brand-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-900">{TYPE_LABEL[record.type]}</p>
                    <p className="text-xs text-stone-400">{record.recordedAt}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-600">{record.content}</p>
                  {record.weight != null && (
                    <p className="mt-0.5 text-sm text-stone-500">{record.weight}kg</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(record)}
                    aria-label="기록 수정"
                    className="flex size-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(record.id)}
                    aria-label="기록 삭제"
                    className="flex size-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
