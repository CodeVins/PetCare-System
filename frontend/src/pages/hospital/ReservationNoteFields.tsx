import { Stethoscope } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHealthRecords } from '../../api/healthRecordApi'
import { formatDateLabel } from '../../lib/format'
import type { HealthRecord } from '../../types/api'

// 서버 규칙과 같음(ReservationService.HEALTH_CHECK_ATTACH_DAYS) — 오래된 문진은 지금 증상과 무관할 수 있어서
const ATTACH_DAYS = 14

interface ReservationNoteFieldsProps {
  petId: string
  memo: string
  onMemoChange: (memo: string) => void
  healthCheckId: number | null
  onHealthCheckChange: (recordId: number | null) => void
}

// 예약 폼의 "병원에 미리 전달할 내용" — 증상 메모 + 최근 자가 문진 첨부(선택).
// 반려동물을 바꾸면 그 아이의 최근 14일 문진을 찾아 기본으로 첨부해 둔다(체크 해제 가능).
export default function ReservationNoteFields({
  petId,
  memo,
  onMemoChange,
  healthCheckId,
  onHealthCheckChange,
}: ReservationNoteFieldsProps) {
  const [latestCheck, setLatestCheck] = useState<HealthRecord | null>(null)

  useEffect(() => {
    if (!petId) return
    let ignore = false
    const since = new Date()
    since.setDate(since.getDate() - ATTACH_DAYS)
    const sinceDate = since.toLocaleDateString('sv-SE')
    getHealthRecords(petId)
      .then(({ data }) => {
        if (ignore) return
        const latest =
          data.data.content
            .filter((record) => record.type === 'HEALTH_CHECK' && record.recordedAt >= sinceDate)
            .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt) || b.id - a.id)[0] ?? null
        setLatestCheck(latest)
        onHealthCheckChange(latest?.id ?? null)
      })
      .catch(() => {
        if (ignore) return
        setLatestCheck(null)
        onHealthCheckChange(null)
      })
    return () => {
      ignore = true
    }
    // onHealthCheckChange는 부모 setState라 매 렌더 같은 함수 — 반려동물이 바뀔 때만 다시 찾는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reservation-memo" className="text-sm font-medium text-stone-700">
          병원에 전달할 증상·요청 <span className="font-normal text-stone-500">(선택)</span>
        </label>
        <textarea
          id="reservation-memo"
          value={memo}
          onChange={(event) => onMemoChange(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="예) 어제부터 귀를 자주 긁어요"
          className="input min-h-24 py-3"
        />
      </div>

      {latestCheck ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
          <input
            type="checkbox"
            checked={healthCheckId === latestCheck.id}
            onChange={(event) => onHealthCheckChange(event.target.checked ? latestCheck.id : null)}
            className="mt-1 size-4 accent-brand-600"
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-bold">
              최근 자가 문진 첨부 ({formatDateLabel(latestCheck.recordedAt)})
            </span>
            <span className="break-words text-sm text-stone-600">{latestCheck.content}</span>
          </span>
        </label>
      ) : (
        petId && (
          <p className="flex items-center gap-1.5 text-sm text-stone-600">
            <Stethoscope size={16} />
            최근 {ATTACH_DAYS}일 안에 한 자가 문진이 없어요.
            <Link to="/health-check" className="font-medium text-brand-700 underline">
              자가 문진 하기
            </Link>
          </p>
        )
      )}
    </div>
  )
}
