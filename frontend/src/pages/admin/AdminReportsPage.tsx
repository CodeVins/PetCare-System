import { useState } from 'react'
import { getReviewReports, hideReview, unhideReview } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import Alert from '../../components/common/Alert'
import Stars from '../../components/common/Stars'
import { useAuth } from '../../hooks/useAuth'
import { usePagedList } from '../../hooks/usePagedList'
import { useToast } from '../../hooks/useToast'
import { formatDateTime } from '../../lib/format'
import type { ReviewReport } from '../../types/api'
import AdminPageHeader from './AdminPageHeader'
import AuthorCell from './AuthorCell'
import ReviewFilterBar, { useReviewFilter } from './ReviewFilterBar'

// 변경(2026-09-30): 신고일·신고자·작성자·병원·상태 필터(URL 쿼리) + 표 형태 + 더 보기로 개편, 병원 소유자
// 콘솔(/dashboard/reports)에서도 같은 화면을 씀 (이전: /admin/reviews, 전체 신고 카드 나열 + "노출중만" 체크박스,
// 신고자는 ID만 표시, 병원명은 병원 목록을 따로 받아 조인)
export default function AdminReportsPage() {
  const { role } = useAuth()
  const toast = useToast()
  const { filter, setFilter, key } = useReviewFilter()
  const {
    items: reports,
    setItems: setReports,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
    total,
  } = usePagedList((page) => getReviewReports(filter, page), key, '신고 목록을 불러오지 못했습니다.')
  const [actingId, setActingId] = useState<number | null>(null)
  const isAdmin = role === 'ADMIN'

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
      toast(report.reviewHidden ? '리뷰를 다시 보이게 했어요.' : '리뷰를 숨겼어요.')
    } catch (err) {
      toast(errorMessage(err, '처리에 실패했습니다.'), 'error')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="신고 관리"
        description="신고일·신고자·리뷰 작성자로 찾아보고, 리뷰 원문을 확인해 숨김 여부를 정합니다"
      />

      <div className="admin-card overflow-hidden">
        <ReviewFilterBar filter={filter} onChange={setFilter} mode="reports" />

        {!loading && !error && (
          <p className="border-b border-stone-100 px-5 py-2.5 text-xs font-medium text-stone-500">
            검색 결과 <span className="font-bold text-stone-900">{total}</span>건
          </p>
        )}

        {loading && <div className="h-48 animate-pulse bg-stone-100" />}
        {!loading && error && (
          <div className="p-5">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {!loading && !error && reports.length === 0 && (
          <p className="p-5 text-sm text-stone-500">조건에 맞는 신고가 없습니다.</p>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-stone-50">
                  <th scope="col" className="admin-th">신고일</th>
                  <th scope="col" className="admin-th">신고자</th>
                  <th scope="col" className="admin-th">사유</th>
                  <th scope="col" className="admin-th w-[36%]">신고된 리뷰</th>
                  <th scope="col" className="admin-th">상태</th>
                  <th scope="col" className="admin-th text-right">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reports.map((report) => (
                  <tr key={report.id} className="align-top hover:bg-stone-50">
                    <td className="admin-td whitespace-nowrap text-stone-600">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="admin-td">
                      <AuthorCell
                        email={report.reporterEmail}
                        userId={report.reporterId}
                        isAdmin={isAdmin}
                        onFilter={() => setFilter({ ...filter, reporter: report.reporterEmail })}
                      />
                    </td>
                    <td className="admin-td max-w-[200px] whitespace-pre-wrap text-stone-700">
                      {report.reason}
                    </td>
                    <td className="admin-td">
                      {/* 리뷰 원문 — 내용과 별점, 누가 언제 썼는지를 같이 봐야 숨김 여부를 판단할 수 있다 */}
                      <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
                        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                          <span className="font-semibold text-stone-700">{report.hospitalName}</span>
                          <Stars value={report.reviewRating} size={12} />
                          <span>작성 {formatDateTime(report.reviewCreatedAt)}</span>
                        </div>
                        <p className="line-clamp-4 whitespace-pre-wrap text-sm text-stone-900">
                          {report.reviewContent}
                        </p>
                        <p className="mt-1.5 text-xs text-stone-500">
                          작성자{' '}
                          <button
                            type="button"
                            onClick={() =>
                              setFilter({ ...filter, author: report.reviewAuthorEmail })
                            }
                            className="font-medium text-stone-700 hover:text-brand-700 hover:underline"
                          >
                            {report.reviewAuthorEmail}
                          </button>
                        </p>
                      </div>
                    </td>
                    <td className="admin-td">
                      <span
                        className={`badge ${report.reviewHidden ? 'badge-neutral' : 'badge-wait'}`}
                      >
                        {report.reviewHidden ? '숨김' : '노출중'}
                      </span>
                    </td>
                    <td className="admin-td">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleHide(report)}
                          disabled={actingId === report.id}
                          className={report.reviewHidden ? 'admin-btn-secondary' : 'admin-btn-danger'}
                        >
                          {report.reviewHidden ? '숨김 해제' : '숨기기'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && hasMore && (
          <div className="border-t border-stone-100 p-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="admin-btn-secondary w-full"
            >
              {loadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
