import { useEffect, useState } from 'react'
import { getReviewReports, hideReview, unhideReview } from '../../api/adminApi'

export default function ReviewModerationSection() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    getReviewReports()
      .then(({ data }) => setReports(data.data.content))
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

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-stone-700">리뷰 신고</h2>

      {loading && <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && reports.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 py-10 text-center text-sm text-stone-500">
          신고된 리뷰가 없습니다.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="space-y-2">
          {reports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-stone-900">{report.reviewContent}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    평점 {report.reviewRating}점 · 신고 사유: {report.reason}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    report.reviewHidden
                      ? 'bg-stone-100 text-stone-500'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {report.reviewHidden ? '숨김' : '노출중'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleHide(report)}
                disabled={actingId === report.id}
                className="mt-3 text-xs font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {report.reviewHidden ? '숨김 해제' : '숨기기'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
