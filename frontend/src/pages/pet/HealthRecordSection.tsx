import { Note, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { deleteHealthRecord, getHealthRecords } from '../../api/healthRecordApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import { formatDateLabel } from '../../lib/format'
import type { HealthRecord, HealthRecordType } from '../../types/api'
import HealthRecordDialog from './HealthRecordDialog'
import { RECORD_TYPE_ORDER, RECORD_TYPES } from './healthRecordTypes'
import WeightChart from './WeightChart'
import { useToast } from '../../hooks/useToast'

type Filter = HealthRecordType | 'ALL'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

// 최신 날짜가 위로, 같은 날짜면 나중에 쓴 기록(id 큰 것)이 위로
function sortByDateDesc(list: HealthRecord[]) {
  return [...list].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt) || b.id - a.id)
}

function monthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split('-')
  return `${year}년 ${Number(month)}월`
}

// 변경(2026-09-27): 작성 폼을 HealthRecordDialog로 분리하고, 목록을 종류 필터 + 월별 묶음 + 날짜 칸
// 형태로 바꿈 (이전: 화면 상단에 항상 펼쳐진 작성 폼 + 모든 기록을 한 줄씩 나열해 찾기 어려웠음)
export default function HealthRecordSection({ petId }: { petId: number | string }) {
  const toast = useToast()
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<HealthRecord | null>(null)

  useEffect(() => {
    getHealthRecords(petId)
      .then(({ data }) => setRecords(sortByDateDesc(data.data.content)))
      .catch((err) => setError(errorMessage(err, '건강기록을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [petId])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (record: HealthRecord) => {
    setEditing(record)
    setDialogOpen(true)
  }

  const handleSaved = (saved: HealthRecord) => {
    toast(editing ? '기록을 수정했어요.' : '기록을 저장했어요.')
    setRecords((prev) =>
      sortByDateDesc(
        prev.some((r) => r.id === saved.id)
          ? prev.map((r) => (r.id === saved.id ? saved : r))
          : [...prev, saved],
      ),
    )
  }

  const handleDelete = async (record: HealthRecord) => {
    const label = `${formatDateLabel(record.recordedAt)} ${RECORD_TYPES[record.type].label} 기록`
    if (!window.confirm(`${label}을 삭제할까요?`)) return
    try {
      await deleteHealthRecord(petId, record.id)
      setRecords((prev) => prev.filter((r) => r.id !== record.id))
      toast('기록을 삭제했어요.')
    } catch (err) {
      // 변경(2026-09-27): 동작 실패를 토스트로 (이전: setError로 목록 전체가 에러 문구로 바뀜)
      toast(errorMessage(err, '삭제에 실패했습니다.'), 'error')
    }
  }

  const counts = useMemo(() => {
    const result = {} as Record<HealthRecordType, number>
    for (const record of records) result[record.type] = (result[record.type] ?? 0) + 1
    return result
  }, [records])

  // 체중 기록(오래된 순) — 그래프와 "지난 측정 대비" 계산에 같이 쓴다
  const weightRecords = useMemo(
    () =>
      records
        .filter(
          (record): record is HealthRecord & { weight: number } =>
            record.type === 'WEIGHT' && record.weight != null,
        )
        .reverse(),
    [records],
  )
  const weightDelta = useMemo(() => {
    const delta = new Map<number, number>()
    weightRecords.forEach((record, index) => {
      if (index > 0) delta.set(record.id, record.weight - weightRecords[index - 1].weight)
    })
    return delta
  }, [weightRecords])

  // 필터 중인 종류의 마지막 기록을 지우면 칩이 사라지므로 전체로 되돌린다
  const activeFilter: Filter = filter !== 'ALL' && !counts[filter] ? 'ALL' : filter
  const visible = activeFilter === 'ALL' ? records : records.filter((r) => r.type === activeFilter)

  // 월별 묶음 [['2026-09', [...]], ...] — visible이 이미 최신순이라 순서 유지
  const byMonth = useMemo(() => {
    const groups = new Map<string, HealthRecord[]>()
    for (const record of visible) {
      const key = record.recordedAt.slice(0, 7)
      groups.set(key, [...(groups.get(key) ?? []), record])
    }
    return Array.from(groups.entries())
  }, [visible])

  const showChart = (activeFilter === 'ALL' || activeFilter === 'WEIGHT') && weightRecords.length >= 2

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          {loading ? '불러오는 중...' : `전체 기록 ${records.length}개`}
        </p>
        <button type="button" onClick={openCreate} className="btn btn-primary btn-sm">
          <Plus size={18} weight="bold" />
          기록 추가
        </button>
      </div>

      {/* 종류 필터 — 기록이 있는 종류만 개수와 함께 */}
      {records.length > 0 && (
        <div
          role="tablist"
          aria-label="기록 종류"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'ALL'}
            onClick={() => setFilter('ALL')}
            className={`chip shrink-0 ${activeFilter === 'ALL' ? 'chip-on' : ''}`}
          >
            전체 <span className="opacity-70">{records.length}</span>
          </button>
          {RECORD_TYPE_ORDER.filter((type) => counts[type]).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={activeFilter === type}
              onClick={() => setFilter(type)}
              className={`chip shrink-0 ${activeFilter === type ? 'chip-on' : ''}`}
            >
              {RECORD_TYPES[type].label} <span className="opacity-70">{counts[type]}</span>
            </button>
          ))}
        </div>
      )}

      {showChart && <WeightChart records={weightRecords} />}

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
          <EmptyState
            icon={Note}
            action={
              <button type="button" onClick={openCreate} className="btn btn-primary btn-sm">
                첫 기록 남기기
              </button>
            }
          >
            아직 기록이 없습니다. 체중이나 접종부터 남겨 보세요.
          </EmptyState>
        </div>
      )}

      {byMonth.map(([month, monthRecords]) => (
        <section key={month} aria-label={monthLabel(month)}>
          <h3 className="mb-2 px-1 text-sm font-bold text-stone-500">{monthLabel(month)}</h3>
          <ul className="card divide-y divide-stone-100 overflow-hidden">
            {monthRecords.map((record, index) => {
              const { label, icon: TypeIcon, tone } = RECORD_TYPES[record.type]
              const date = new Date(`${record.recordedAt}T00:00:00`)
              // 같은 날짜가 이어지면 날짜 칸은 첫 줄에만
              const sameDayAsPrev = index > 0 && monthRecords[index - 1].recordedAt === record.recordedAt
              const delta = weightDelta.get(record.id)
              return (
                <li key={record.id} className="flex gap-3 px-3 py-3.5 md:gap-4 md:px-5">
                  <div className="w-9 shrink-0 text-center" aria-hidden={sameDayAsPrev}>
                    {!sameDayAsPrev && (
                      <>
                        <p className="text-lg font-bold leading-tight">{date.getDate()}</p>
                        <p className="text-xs text-stone-500">{WEEKDAY[date.getDay()]}</p>
                      </>
                    )}
                  </div>

                  <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <TypeIcon size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-stone-500">
                      {label}
                      <span className="sr-only"> · {formatDateLabel(record.recordedAt)}</span>
                    </p>
                    {record.type === 'WEIGHT' && record.weight != null && (
                      <p className="text-lg font-bold leading-snug">
                        {record.weight}kg
                        {delta !== undefined && delta !== 0 && (
                          <span
                            className={`ml-2 text-[13px] font-medium ${delta > 0 ? 'text-rose-600' : 'text-sky-700'}`}
                          >
                            {delta > 0 ? '+' : ''}
                            {delta.toFixed(1)}kg
                          </span>
                        )}
                      </p>
                    )}
                    {/* 체중 자동 메모("체중 4.2kg")는 수치와 겹치니 숨긴다 */}
                    {!(record.type === 'WEIGHT' && record.content === `체중 ${record.weight}kg`) && (
                      <p className="break-words text-[15px] text-stone-800">{record.content}</p>
                    )}
                    {record.nextDueDate && (
                      <p className="mt-1.5">
                        <span className="badge badge-wait h-6 px-2 text-xs">
                          다음 접종 {formatDateLabel(record.nextDueDate)}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="-mr-2 flex shrink-0 items-start">
                    <button
                      type="button"
                      onClick={() => openEdit(record)}
                      aria-label={`${label} 기록 수정`}
                      className="flex size-10 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                    >
                      <PencilSimple size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record)}
                      aria-label={`${label} 기록 삭제`}
                      className="flex size-10 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash size={17} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {dialogOpen && (
        <HealthRecordDialog
          key={editing?.id ?? 'new'}
          petId={petId}
          record={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
