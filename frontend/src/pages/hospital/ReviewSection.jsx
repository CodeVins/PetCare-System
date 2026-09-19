import { Star, WarningCircle } from '@phosphor-icons/react'
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
import Button from '../../components/common/Button'

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

function StarRating({ value }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          weight={n <= value ? 'fill' : 'regular'}
          className="text-amber-500"
        />
      ))}
    </span>
  )
}

export default function ReviewSection({ hospitalId, isManager }) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          prev.map((review) => (review.id === myReviewId ? { ...review, ...data.data } : review)),
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
        prev.map((review) => (review.id === reviewId ? { ...review, reply: data.data } : review)),
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

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-stone-700">리뷰</h2>

      {(!myReview || editing) && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">평점</span>
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}점
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? '리뷰 수정' : '리뷰 등록'}
            </Button>
            {editing && (
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
      )}

      {loading && <div className="h-20 animate-pulse rounded-2xl bg-stone-100" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
          아직 리뷰가 없습니다.
        </p>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="space-y-2">
          {reviews.map((review) => {
            const isMine = review.id === myReviewId
            return (
              <div
                key={review.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <StarRating value={review.rating} />
                  <span className="text-xs text-stone-400">
                    {review.createdAt.slice(0, 10)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-700">{review.content}</p>

                {review.reply && (
                  <div className="mt-3 rounded-xl bg-stone-50 p-3">
                    <p className="text-xs font-medium text-stone-500">병원 답글</p>
                    <p className="mt-1 text-sm text-stone-700">{review.reply.content}</p>
                    {isManager && (
                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => startReplyEdit(review)}
                          className="text-xs font-medium text-stone-500 hover:text-brand-700"
                        >
                          답글 수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplyDelete(review.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          답글 삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {isMine && (
                    <>
                      <button
                        type="button"
                        onClick={startEdit}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </>
                  )}
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportingId(review.id)
                        setReportMessage('')
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-red-600"
                    >
                      <WarningCircle size={12} />
                      신고
                    </button>
                  )}
                  {isManager && !review.reply && replyingId !== review.id && (
                    <button
                      type="button"
                      onClick={() => startReplyEdit({ id: review.id, reply: null })}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      답글 달기
                    </button>
                  )}
                </div>

                {reportingId === review.id && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={reportReason}
                        onChange={(event) => setReportReason(event.target.value)}
                        placeholder="신고 사유"
                        className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleReport(review.id)}
                        disabled={reporting}
                        className="text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        제출
                      </button>
                    </div>
                    {reportMessage && <p className="text-xs text-stone-500">{reportMessage}</p>}
                  </div>
                )}

                {replyingId === review.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      placeholder="답글 내용"
                      className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(review.id, Boolean(review.reply))}
                      disabled={replySaving}
                      className="text-xs font-medium text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      등록
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
