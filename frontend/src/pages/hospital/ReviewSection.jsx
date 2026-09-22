import { ChatCircleDots, Star, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import {
  createReply,
  createReview,
  deleteReply,
  deleteReview,
  getReviews,
  reportReview,
  updateReply,
  updateReview,
} from '../../api/reviewApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Stars from '../../components/common/Stars'

const MY_REVIEWS_KEY = 'myReviewIds'

// ponytail: ReviewResponse has no author field, so "is this my review" can't be
// determined from the list. We remember the id locally after a successful post —
// works on this browser only; a different device won't show edit/delete controls.
function getMyReviewId(hospitalId) {
  try {
    const map = JSON.parse(localStorage.getItem(MY_REVIEWS_KEY) || '{}')
    return map[hospitalId] ?? null
  } catch {
    return null
  }
}

function setMyReviewId(hospitalId, reviewId) {
  try {
    const map = JSON.parse(localStorage.getItem(MY_REVIEWS_KEY) || '{}')
    if (reviewId == null) delete map[hospitalId]
    else map[hospitalId] = reviewId
    localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

// 별 자체를 누르는 평점 입력 (radiogroup 시맨틱 유지)
function StarPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="평점" className="-ml-1.5 flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className={`flex size-11 items-center justify-center transition-colors ${
            n <= value ? 'text-amber-700' : 'text-stone-300'
          }`}
        >
          <Star size={28} weight="fill" />
        </button>
      ))}
    </div>
  )
}

export default function ReviewSection({
  hospitalId,
  isManager,
  canWrite = true,
  averageRating,
  reviewCount,
}) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [myReviewId, setMyReviewIdState] = useState(() => getMyReviewId(hospitalId))

  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [reportingId, setReportingId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportMessage, setReportMessage] = useState('')

  const [replyingId, setReplyingId] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replySaving, setReplySaving] = useState(false)

  useEffect(() => {
    getReviews(hospitalId)
      .then(({ data }) => setReviews(data.data.content))
      .catch((err) => setError(err.response?.data?.message || '리뷰를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [hospitalId])

  const myReview = reviews.find((review) => review.id === myReviewId) || null

  const startEdit = () => {
    if (!myReview) return
    setRating(myReview.rating)
    setContent(myReview.content)
    setEditing(true)
    setFormError('')
  }

  const cancelEdit = () => {
    setEditing(false)
    setRating(5)
    setContent('')
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      if (editing && myReviewId) {
        const { data } = await updateReview(hospitalId, myReviewId, { rating, content })
        setReviews((prev) =>
          prev.map((review) =>
            review.id === myReviewId ? { ...review, ...data.data } : review,
          ),
        )
      } else {
        const { data } = await createReview(hospitalId, { rating, content })
        setReviews((prev) => [data.data, ...prev])
        setMyReviewId(hospitalId, data.data.id)
        setMyReviewIdState(data.data.id)
      }
      cancelEdit()
    } catch (err) {
      setFormError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!myReviewId) return
    if (!window.confirm('리뷰를 삭제할까요?')) return
    try {
      await deleteReview(hospitalId, myReviewId)
      setReviews((prev) => prev.filter((review) => review.id !== myReviewId))
      setMyReviewId(hospitalId, null)
      setMyReviewIdState(null)
      cancelEdit()
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.')
    }
  }

  const handleReport = async (reviewId) => {
    if (!reportReason.trim()) return
    setReporting(true)
    setReportMessage('')
    try {
      await reportReview(hospitalId, reviewId, reportReason.trim())
      setReportMessage('신고가 접수되었습니다.')
      setReportReason('')
      setTimeout(() => setReportingId(null), 800)
    } catch (err) {
      setReportMessage(err.response?.data?.message || '신고에 실패했습니다.')
    } finally {
      setReporting(false)
    }
  }

  const startReplyEdit = (review) => {
    setReplyingId(review.id)
    setReplyContent(review.reply?.content || '')
  }

  const handleReplySubmit = async (reviewId, hasExistingReply) => {
    if (!replyContent.trim()) return
    setReplySaving(true)
    try {
      const action = hasExistingReply ? updateReply : createReply
      const { data } = await action(hospitalId, reviewId, replyContent.trim())
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, reply: data.data } : review,
        ),
      )
      setReplyingId(null)
      setReplyContent('')
    } catch (err) {
      setError(err.response?.data?.message || '답글 저장에 실패했습니다.')
    } finally {
      setReplySaving(false)
    }
  }

  const handleReplyDelete = async (reviewId) => {
    if (!window.confirm('답글을 삭제할까요?')) return
    try {
      await deleteReply(hospitalId, reviewId)
      setReviews((prev) =>
        prev.map((review) => (review.id === reviewId ? { ...review, reply: null } : review)),
      )
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.')
    }
  }

  // 부모가 값을 안 주면 목록에서 직접 평균을 낸다
  const average =
    averageRating ??
    (reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null)
  const count = reviewCount ?? reviews.length

  const linkBtn = 'text-[13px] font-medium hover:underline'

  return (
    <div className="flex flex-col gap-3">
      {average != null && (
        <section className="card flex items-center gap-4 p-5">
          <span className="font-display text-[44px] leading-none">
            {average.toFixed(1)}
          </span>
          <div className="flex flex-col gap-0.5">
            <Stars value={Math.round(average)} size={18} />
            <span className="text-[13px] text-stone-600">리뷰 {count}개</span>
          </div>
        </section>
      )}

      {canWrite && (!myReview || editing) && (
        <form
          onSubmit={handleSubmit}
          className="card flex flex-col gap-3 p-5"
          aria-labelledby="h-review-write"
        >
          <h3 id="h-review-write" className="text-base font-bold">
            {editing ? '리뷰 수정' : '리뷰 쓰기'}
          </h3>
          <StarPicker value={rating} onChange={setRating} />
          <label htmlFor="review-content" className="sr-only">
            리뷰 내용
          </label>
          <textarea
            id="review-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            required
            placeholder="진료 경험을 남겨 주세요"
            className="input resize-none"
          />
          <Alert tone="error">{formError}</Alert>
          <div className="flex gap-2">
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? '리뷰 수정' : '리뷰 등록'}
            </Button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="btn btn-secondary">
                취소
              </button>
            )}
          </div>
        </form>
      )}

      {loading && <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />}
      {!loading && error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && reviews.length === 0 && (
        <div className="card">
          <EmptyState icon={ChatCircleDots}>아직 리뷰가 없습니다.</EmptyState>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => {
            const isMine = review.id === myReviewId
            return (
              <article key={review.id} className="card flex flex-col gap-2 p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={review.rating} />
                  <span className="text-[13px] text-stone-600">
                    {review.createdAt.slice(0, 10).replaceAll('-', '.')}
                  </span>
                  {isMine && (
                    <span className="badge h-6 bg-brand-50 px-2 text-xs text-brand-700">
                      내 리뷰
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-wrap text-[15px]">{review.content}</p>

                {review.reply && (
                  <div className="flex flex-col gap-0.5 rounded-xl bg-stone-100 px-3.5 py-3">
                    <span className="text-xs font-bold text-brand-700">병원 답글</span>
                    <span className="text-sm text-stone-800">{review.reply.content}</span>
                    {isManager && (
                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => startReplyEdit(review)}
                          className={`${linkBtn} text-stone-600`}
                        >
                          답글 수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplyDelete(review.id)}
                          className={`${linkBtn} text-red-700`}
                        >
                          답글 삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {isMine ? (
                    <>
                      <button
                        type="button"
                        onClick={startEdit}
                        className={`${linkBtn} text-brand-600`}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className={`${linkBtn} text-red-700`}
                      >
                        삭제
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReportingId(review.id)
                        setReportMessage('')
                      }}
                      className={`${linkBtn} flex items-center gap-1 text-stone-600 hover:text-red-700`}
                    >
                      <WarningCircle size={14} />
                      신고
                    </button>
                  )}
                  {isManager && !review.reply && replyingId !== review.id && (
                    <button
                      type="button"
                      onClick={() => startReplyEdit({ id: review.id, reply: null })}
                      className={`${linkBtn} text-brand-600`}
                    >
                      답글 달기
                    </button>
                  )}
                </div>

                {reportingId === review.id && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={reportReason}
                        onChange={(event) => setReportReason(event.target.value)}
                        placeholder="신고 사유"
                        aria-label="신고 사유"
                        className="input h-11 flex-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleReport(review.id)}
                        disabled={reporting}
                        className="btn btn-danger btn-sm disabled:opacity-50"
                      >
                        제출
                      </button>
                    </div>
                    {reportMessage && (
                      <p className="text-[13px] text-stone-600">{reportMessage}</p>
                    )}
                  </div>
                )}

                {replyingId === review.id && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      placeholder="답글 내용"
                      aria-label="답글 내용"
                      className="input h-11 flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(review.id, Boolean(review.reply))}
                      disabled={replySaving}
                      className="btn btn-primary btn-sm disabled:opacity-50"
                    >
                      등록
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
