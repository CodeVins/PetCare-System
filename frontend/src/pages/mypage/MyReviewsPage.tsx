import { ChatText, EyeSlash } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { getMyReviews } from '../../api/userApi'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import Stars from '../../components/common/Stars'
import { usePagedList } from '../../hooks/usePagedList'
import { formatDateTime } from '../../lib/format'

// 마이페이지 "내가 쓴 리뷰" — 병원별 리뷰와 병원 답글을 한곳에서. 수정·삭제는 병원 상세의
// 리뷰 영역(ReviewSection)에서 하므로 여기선 병원으로 가는 링크만 둔다.
export default function MyReviewsPage() {
  const { items: reviews, loading, error, hasMore, loadMore, loadingMore, total } = usePagedList(
    getMyReviews,
    'my-reviews',
    '내 리뷰를 불러오지 못했습니다.',
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader
        back
        title="내가 쓴 리뷰"
        subtitle={!loading && !error && total > 0 ? `총 ${total}개` : undefined}
      />

      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}
      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && reviews.length === 0 && (
        <div className="card">
          <EmptyState
            icon={ChatText}
            action={
              <Link to="/reservations" className="btn btn-primary btn-sm">
                예약 내역 보기
              </Link>
            }
          >
            아직 작성한 리뷰가 없어요. 진료가 확정된 병원에 리뷰를 남길 수 있어요.
          </EmptyState>
        </div>
      )}

      {!loading &&
        !error &&
        reviews.map((review) => (
          <article key={review.id} className="card flex flex-col gap-3 p-4 md:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/hospitals/${review.hospitalId}`}
                  className="block truncate text-base font-bold hover:text-brand-700"
                >
                  {review.hospitalName}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-[13px] text-stone-500">
                  <Stars value={review.rating} size={14} />
                  <span>{formatDateTime(review.createdAt)}</span>
                </div>
              </div>
              {review.hidden && (
                <span className="badge badge-neutral shrink-0 gap-1">
                  <EyeSlash size={14} />
                  숨김 처리됨
                </span>
              )}
            </div>

            <p className="whitespace-pre-wrap text-[15px]">{review.content}</p>

            {review.hidden && (
              <p className="text-[13px] text-stone-500">
                신고 검토 결과 다른 사람에게 보이지 않는 리뷰예요. 문의는 고객센터(FAQ)를 이용해 주세요.
              </p>
            )}

            {review.reply && (
              <div className="rounded-xl bg-brand-50 p-3.5">
                <p className="mb-1 text-[13px] font-bold text-brand-700">
                  병원 답글
                  <span className="ml-2 font-normal text-stone-500">
                    {formatDateTime(review.reply.createdAt)}
                  </span>
                </p>
                <p className="whitespace-pre-wrap text-sm text-stone-800">{review.reply.content}</p>
              </div>
            )}
          </article>
        ))}

      {!loading && !error && hasMore && (
        <button type="button" onClick={loadMore} disabled={loadingMore} className="btn btn-secondary w-full">
          {loadingMore ? '불러오는 중...' : '더 보기'}
        </button>
      )}
    </div>
  )
}
