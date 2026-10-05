import { ChatCircleDots, Star, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import {
  createReply,
  createReview,
  deleteReply,
  deleteReview,
  deleteReviewImage,
  getReviews,
  reportReview,
  updateReply,
  updateReview,
  uploadReviewImage,
  MAX_REVIEW_IMAGES,
} from '../../api/reviewApi'
import ReviewImages from './ReviewImages'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import LoginRequired from '../../components/common/LoginRequired'
import Stars from '../../components/common/Stars'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import type { Review } from '../../types/api'

// 별 자체를 누르는 평점 입력 (radiogroup 시맨틱 유지)
function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
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

interface ReviewSectionProps {
  hospitalId: number | string
  isManager: boolean
  canWrite?: boolean
  averageRating?: number | null
  reviewCount?: number
}

export default function ReviewSection({
  hospitalId,
  isManager,
  canWrite = true,
  averageRating,
  reviewCount,
}: ReviewSectionProps) {
  const { isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  // 새 리뷰와 함께 올릴 사진 — 리뷰를 만든 뒤 한 장씩 업로드
  const [newImages, setNewImages] = useState<File[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  const [reportingId, setReportingId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const toast = useToast()

  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replySaving, setReplySaving] = useState(false)

  useEffect(() => {
    getReviews(hospitalId)
      .then(({ data }) => setReviews(data.data.content))
      .catch((err) => setError(errorMessage(err, '리뷰를 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [hospitalId])

  // 변경(2026-09-27): 내 리뷰를 서버가 내려주는 review.mine으로 판별 (이전: ReviewResponse에 작성자 정보가
  // 없어서 작성 직후 id를 localStorage에 저장해 추적 — 다른 브라우저/기기에선 수정·삭제 버튼이 안 보였음)
  const myReview = reviews.find((review) => review.mine) || null
  const myReviewId = myReview?.id ?? null

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      if (editing && myReviewId) {
        const { data } = await updateReview(hospitalId, myReviewId, { rating, content })
        // 변경(2026-09-27): 기존 답글(reply) 유지 — 수정 응답은 reply가 항상 null이라 그대로 덮어쓰면
        // 병원 답글이 새로고침 전까지 사라졌음 (이전: { ...review, ...data.data })
        setReviews((prev) =>
          prev.map((review) =>
            review.id === myReviewId ? { ...review, ...data.data, reply: review.reply } : review,
          ),
        )
        toast('리뷰를 수정했어요.')
      } else {
        const { data } = await createReview(hospitalId, { rating, content })
        // 변경(2026-10-05): 리뷰 생성 후 고른 사진을 한 장씩 업로드 — 사진 실패는 리뷰를 되돌리지 않고 안내만
        // (이전: 사진 없음)
        let created = data.data
        let failed = 0
        for (const file of newImages) {
          try {
            created = (await uploadReviewImage(hospitalId, created.id, file)).data.data
          } catch {
            failed += 1
          }
        }
        setReviews((prev) => [created, ...prev])
        setNewImages([])
        toast(failed > 0 ? `리뷰를 등록했어요. 사진 ${failed}장은 올리지 못했어요.` : '리뷰를 등록했어요.')
      }
      cancelEdit()
    } catch (err) {
      setFormError(errorMessage(err, '저장에 실패했습니다.'))
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
      cancelEdit()
      toast('리뷰를 삭제했어요.')
    } catch (err) {
      // 변경(2026-09-27): 동작 실패는 토스트로 (이전: setError로 리뷰 목록 전체가 에러 문구로 바뀜)
      toast(errorMessage(err, '삭제에 실패했습니다.'), 'error')
    }
  }

  // 내 리뷰에 사진 추가(남은 장수만큼) / 삭제 — 응답의 imageUrls로 교체(답글은 유지)
  const replaceMyImages = (imageUrls: string[]) =>
    setReviews((prev) =>
      prev.map((review) => (review.id === myReviewId ? { ...review, imageUrls } : review)),
    )

  const handleImageAdd = async (files: FileList | null) => {
    if (!myReview || !files) return
    const room = MAX_REVIEW_IMAGES - myReview.imageUrls.length
    setUploadingImage(true)
    try {
      for (const file of Array.from(files).slice(0, room)) {
        const { data } = await uploadReviewImage(hospitalId, myReview.id, file)
        replaceMyImages(data.data.imageUrls)
      }
      if (files.length > room) toast(`사진은 최대 ${MAX_REVIEW_IMAGES}장까지 올릴 수 있어요.`)
    } catch (err) {
      toast(errorMessage(err, '사진을 올리지 못했습니다.'), 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageDelete = async (imageUrl: string) => {
    if (!myReview || !window.confirm('이 사진을 삭제할까요?')) return
    try {
      const { data } = await deleteReviewImage(hospitalId, myReview.id, imageUrl)
      replaceMyImages(data.data.imageUrls)
    } catch (err) {
      toast(errorMessage(err, '사진을 삭제하지 못했습니다.'), 'error')
    }
  }

  const handleReport = async (reviewId: number) => {
    if (!reportReason.trim()) return
    setReporting(true)
    try {
      await reportReview(hospitalId, reviewId, reportReason.trim())
      // 변경(2026-09-27): 신고 결과를 토스트로 하고 입력창은 바로 닫음 (이전: 입력창 아래 문구 0.8초 후 닫힘)
      toast('신고가 접수됐어요.')
      setReportReason('')
      setReportingId(null)
    } catch (err) {
      toast(errorMessage(err, '신고에 실패했습니다.'), 'error')
    } finally {
      setReporting(false)
    }
  }

  const startReplyEdit = (review: Pick<Review, 'id' | 'reply'>) => {
    setReplyingId(review.id)
    setReplyContent(review.reply?.content || '')
  }

  const handleReplySubmit = async (reviewId: number, hasExistingReply: boolean) => {
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
      toast(hasExistingReply ? '답글을 수정했어요.' : '답글을 등록했어요.')
    } catch (err) {
      toast(errorMessage(err, '답글 저장에 실패했습니다.'), 'error')
    } finally {
      setReplySaving(false)
    }
  }

  const handleReplyDelete = async (reviewId: number) => {
    if (!window.confirm('답글을 삭제할까요?')) return
    try {
      await deleteReply(hospitalId, reviewId)
      setReviews((prev) =>
        prev.map((review) => (review.id === reviewId ? { ...review, reply: null } : review)),
      )
      toast('답글을 삭제했어요.')
    } catch (err) {
      toast(errorMessage(err, '삭제에 실패했습니다.'), 'error')
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
          <span className="font-display text-[44px] leading-none">{average.toFixed(1)}</span>
          <div className="flex flex-col gap-0.5">
            <Stars value={Math.round(average)} size={18} />
            <span className="text-[13px] text-stone-600">리뷰 {count}개</span>
          </div>
        </section>
      )}

      {/* 변경(2026-09-27): 비회원은 작성 폼 대신 로그인 안내 (이전: 로그인 전제라 분기 없음) */}
      {canWrite && !isAuthenticated && <LoginRequired feature="리뷰 작성" compact />}

      {canWrite && isAuthenticated && (!myReview || editing) && (
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
          {/* 변경(2026-10-05): 새 리뷰에 사진 첨부(최대 3장) — 수정 때는 목록의 내 리뷰에서 사진을 추가/삭제 (이전: 사진 없음) */}
          {!editing && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-images" className="text-sm font-medium text-stone-700">
                사진 <span className="font-normal text-stone-500">(선택, 최대 {MAX_REVIEW_IMAGES}장 · jpg/png/webp 5MB)</span>
              </label>
              <input
                id="review-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length > MAX_REVIEW_IMAGES) {
                    toast(`사진은 최대 ${MAX_REVIEW_IMAGES}장까지 올릴 수 있어요.`)
                  }
                  setNewImages(files.slice(0, MAX_REVIEW_IMAGES))
                }}
                className="text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium"
              />
              {newImages.length > 0 && (
                <p className="text-xs text-stone-600">{newImages.map((file) => file.name).join(', ')}</p>
              )}
            </div>
          )}
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

                <ReviewImages
                  imageUrls={review.imageUrls}
                  onDelete={isMine ? handleImageDelete : undefined}
                />
                {isMine && review.imageUrls.length < MAX_REVIEW_IMAGES && (
                  <label className={`${linkBtn} w-fit cursor-pointer text-brand-700`}>
                    {uploadingImage ? '사진 올리는 중...' : `사진 추가 (${review.imageUrls.length}/${MAX_REVIEW_IMAGES})`}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploadingImage}
                      onChange={(event) => {
                        handleImageAdd(event.target.files)
                        event.target.value = ''
                      }}
                      className="sr-only"
                    />
                  </label>
                )}

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

                {/* 비회원은 신고/수정 같은 동작 줄 자체를 숨긴다 */}
                {isAuthenticated && (
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
                        onClick={() => setReportingId(review.id)}
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
                )}

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
