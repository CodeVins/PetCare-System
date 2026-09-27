import { errorMessage } from '../../api/axiosInstance'
import { Flag } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getReviewReports, hideReview, unhideReview } from '../../api/adminApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import Stars from '../../components/common/Stars'
import { formatDateTime } from '../../lib/format'
import type { ReviewReport } from '../../types/api'

// 관리자 /admin/reviews 와 같은 API — 서버가 HOSPITAL_OWNER에게는 본인 병원 신고만
// 스코핑해서 내려준다. 화면만 소비자 앱 톤(card/badge/btn-*)으로.
export default function ReviewReportSection({
  hospitalNameById,
}: {
  hospitalNameById: Record<number, string>
}) {
  const [reports, setReports] = useState<ReviewReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState<number | null>(null)

  useEffect(() => {
    getReviewReports()
      .then(({ data }) => setReports(data.data.content))
      .catch((err) =>
        setError(errorMessage(err, '신고 목록을 불러오지 못했습니다.')),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleToggleHide = async (report: ReviewReport) => {
    setActingId(report.id)
    try {
      await (report.reviewHidden ? unhideReview : hideReview)(report.reviewId)
      // 같은 리뷰에 신고가 여러 건이면 전부 같이 바뀌어야 함
      setReports((prev) =>
        prev.map((r) =>
          r.reviewId === report.reviewId ? { ...r, reviewHidden: !report.reviewHidden } : r,
        ),
      )
    } catch (err) {
      setError(errorMessage(err, '처리에 실패했습니다.'))
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert tone="error">{error}</Alert>

      {reports.length === 0 && !error && (
        <div className="card">
          <EmptyState icon={Flag}>신고된 리뷰가 없습니다.</EmptyState>
        </div>
      )}

      {reports.map((report) => (
        <article key={report.id} className="card flex flex-col gap-3 p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-[13px] text-stone-600">
              <span className="font-bold text-stone-800">
                {hospitalNameById[report.hospitalId] ?? `병원 ID ${report.hospitalId}`}
              </span>
              {' · '}신고 {formatDateTime(report.createdAt)}
            </p>
            <span className={`badge ${report.reviewHidden ? 'badge-neutral' : 'badge-wait'}`}>
              {report.reviewHidden ? '숨김' : '노출중'}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <Stars value={report.reviewRating} size={15} className="mb-1.5" />
            <p className="whitespace-pre-wrap text-[15px]">{report.reviewContent}</p>
          </div>

          <p className="text-sm text-stone-600">
            <span className="font-medium text-stone-500">신고 사유</span> {report.reason}
          </p>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleToggleHide(report)}
              disabled={actingId === report.id}
              className={`btn-sm disabled:opacity-50 ${
                report.reviewHidden ? 'btn-secondary' : 'btn-danger'
              }`}
            >
              {report.reviewHidden ? '숨김 해제' : '숨기기'}
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
