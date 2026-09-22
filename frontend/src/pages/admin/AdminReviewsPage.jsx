import { useEffect, useState } from 'react'
import { getReviewReports, hideReview, unhideReview } from '../../api/adminApi'
import { getHospitals } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import Stars from '../../components/common/Stars'
import { formatDateTime } from '../../lib/format'
import AdminPageHeader from './AdminPageHeader'

export default function AdminReviewsPage() {
  const [reports, setReports] = useState([])
  const [hospitalNameById, setHospitalNameById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [onlyPending, setOnlyPending] = useState(false)

  useEffect(() => {
    Promise.all([getReviewReports(), getHospitals()])
      .then(([reportsRes, hospitalsRes]) => {
        setReports(reportsRes.data.data.content)
        setHospitalNameById(
          Object.fromEntries(hospitalsRes.data.data.map((h) => [h.id, h.name])),
        )
      })
      .catch((err) =>
        setError(err.response?.data?.message || '신고 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleToggleHide = async (report) => {
    setActingId(report.id)
    try {
      if (report.reviewHidden) {
        await unhideReview(report.reviewId)
      } else {
        await hideReview(report.reviewId)
      }
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, reviewHidden: !r.reviewHidden } : r)),
      )
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
    } finally {
      setActingId(null)
    }
  }

  const pendingCount = reports.filter((r) => !r.reviewHidden).length
  const rows = onlyPending ? reports.filter((r) => !r.reviewHidden) : reports

  return (
    <div>
      <AdminPageHeader
        title="리뷰 신고"
        description={`전체 ${reports.length}건 · 노출중 ${pendingCount}건`}
        action={
          <label className="flex items-center gap-1.5 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={onlyPending}
              onChange={(event) => setOnlyPending(event.target.checked)}
              className="accent-brand-600"
            />
            노출중인 신고만
          </label>
        }
      />

      {loading && <div className="h-64 animate-pulse rounded-xl bg-stone-200" />}
      {!loading && error && <Alert tone="error">{error}</Alert>}
      {!loading && !error && rows.length === 0 && (
        <div className="admin-card p-5">
          <p className="text-sm text-stone-500">
            {onlyPending ? '노출중인 신고가 없습니다.' : '신고된 리뷰가 없습니다.'}
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {rows.map((report) => (
            <article key={report.id} className="admin-card flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-stone-500">
                  <span className="font-medium text-stone-700">
                    {hospitalNameById[report.hospitalId] ?? `병원 ID ${report.hospitalId}`}
                  </span>
                  <span>·</span>
                  <span>신고 {formatDateTime(report.createdAt)}</span>
                  <span>·</span>
                  <span>신고자 ID {report.reporterId}</span>
                </div>
                {report.reviewHidden ? (
                  <span className="badge badge-neutral">숨김</span>
                ) : (
                  <span className="badge badge-wait">노출중</span>
                )}
              </div>

              {/* 리뷰 원문 — 내용과 별점을 그대로 보여줘야 숨김 여부를 판단할 수 있다 */}
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                <Stars value={report.reviewRating} size={15} className="mb-1.5" />
                <p className="whitespace-pre-wrap text-[15px] text-stone-900">
                  {report.reviewContent}
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm text-stone-600">
                <span className="shrink-0 font-medium text-stone-500">신고 사유</span>
                <p className="whitespace-pre-wrap">{report.reason}</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleToggleHide(report)}
                  disabled={actingId === report.id}
                  className={report.reviewHidden ? 'admin-btn-primary' : 'admin-btn-danger'}
                >
                  {report.reviewHidden ? '숨김 해제' : '숨기기'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
