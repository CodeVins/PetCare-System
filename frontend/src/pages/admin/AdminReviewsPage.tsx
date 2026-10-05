import { CaretDown, CaretUp, ChatText } from '@phosphor-icons/react'
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { getManagedReviews, hideReview, unhideReview } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import { createReply, deleteReply, updateReply } from '../../api/reviewApi'
import Alert from '../../components/common/Alert'
import Stars from '../../components/common/Stars'
import { useAuth } from '../../hooks/useAuth'
import { usePagedList } from '../../hooks/usePagedList'
import { useToast } from '../../hooks/useToast'
import { formatDateTime } from '../../lib/format'
import type { ManagedReview } from '../../types/api'
import AdminPageHeader from './AdminPageHeader'
import AuthorCell from './AuthorCell'
import ReviewFilterBar, { useReviewFilter } from './ReviewFilterBar'
import ReviewImages from '../hospital/ReviewImages'

// 리뷰 관리 — 관리자는 전체 병원, 병원 소유자는 본인 병원 리뷰만(서버 스코핑).
// 공개 목록과 달리 숨긴 리뷰도 보이고, 작성자·신고 수·답글 여부를 한 줄에서 본다.
export default function AdminReviewsPage() {
  const { role } = useAuth()
  const toast = useToast()
  const { filter, setFilter, key } = useReviewFilter()
  const {
    items: reviews,
    setItems: setReviews,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
    total,
  } = usePagedList((page) => getManagedReviews(filter, page), key, '리뷰 목록을 불러오지 못했습니다.')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)

  const patch = (id: number, changes: Partial<ManagedReview>) =>
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))

  const handleToggleHide = async (review: ManagedReview) => {
    setActingId(review.id)
    try {
      await (review.hidden ? unhideReview : hideReview)(review.id)
      patch(review.id, { hidden: !review.hidden })
      toast(review.hidden ? '리뷰를 다시 보이게 했어요.' : '리뷰를 숨겼어요.')
    } catch (err) {
      toast(errorMessage(err, '처리에 실패했습니다.'), 'error')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="리뷰 관리"
        description={
          role === 'ADMIN'
            ? '전체 병원의 리뷰를 작성일·작성자·상태로 찾아보고 숨김/답글을 처리합니다'
            : '내 병원에 달린 리뷰를 작성일·작성자·상태로 찾아보고 답글을 남깁니다'
        }
      />

      <div className="admin-card overflow-hidden">
        <ReviewFilterBar filter={filter} onChange={setFilter} mode="reviews" />

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
        {!loading && !error && reviews.length === 0 && (
          <p className="p-5 text-sm text-stone-500">조건에 맞는 리뷰가 없습니다.</p>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-stone-50">
                  <th scope="col" className="admin-th">작성일</th>
                  <th scope="col" className="admin-th">병원</th>
                  <th scope="col" className="admin-th">작성자</th>
                  <th scope="col" className="admin-th">별점</th>
                  <th scope="col" className="admin-th w-[32%]">내용</th>
                  <th scope="col" className="admin-th text-center">신고</th>
                  <th scope="col" className="admin-th">상태</th>
                  <th scope="col" className="admin-th text-right">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reviews.map((review) => {
                  const expanded = expandedId === review.id
                  return (
                    <Fragment key={review.id}>
                      <tr className={review.hidden ? 'bg-stone-50/60' : 'hover:bg-stone-50'}>
                        <td className="admin-td whitespace-nowrap text-stone-600">
                          {formatDateTime(review.createdAt)}
                        </td>
                        <td className="admin-td whitespace-nowrap font-medium text-stone-900">
                          {review.hospitalName}
                        </td>
                        <td className="admin-td">
                          <AuthorCell
                            email={review.authorEmail}
                            userId={review.authorId}
                            isAdmin={role === 'ADMIN'}
                            onFilter={() => setFilter({ ...filter, author: review.authorEmail })}
                          />
                        </td>
                        <td className="admin-td">
                          <Stars value={review.rating} size={14} />
                        </td>
                        <td className="admin-td">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : review.id)}
                            aria-expanded={expanded}
                            className="flex w-full items-start gap-1.5 text-left"
                          >
                            <span className={`flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
                              {review.content}
                            </span>
                            {expanded ? (
                              <CaretUp size={14} className="mt-1 shrink-0 text-stone-400" />
                            ) : (
                              <CaretDown size={14} className="mt-1 shrink-0 text-stone-400" />
                            )}
                          </button>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 text-xs ${
                              review.reply ? 'text-brand-700' : 'text-stone-400'
                            }`}
                          >
                            <ChatText size={13} />
                            {review.reply ? '답글 있음' : '답글 없음'}
                          </span>
                          {/* 변경(2026-10-05): 리뷰 사진 — 접힌 상태는 장수만, 펼치면 썸네일(부적절한 사진 확인용) (이전: 사진 없음) */}
                          {review.imageUrls.length > 0 &&
                            (expanded ? (
                              <div className="mt-2">
                                <ReviewImages imageUrls={review.imageUrls} />
                              </div>
                            ) : (
                              <span className="ml-2 mt-1 inline-block text-xs text-stone-500">
                                사진 {review.imageUrls.length}장
                              </span>
                            ))}
                        </td>
                        <td className="admin-td text-center">
                          {review.reportCount > 0 ? (
                            <Link
                              to={`../reports?hospitalId=${review.hospitalId}&author=${encodeURIComponent(review.authorEmail)}`}
                              relative="path"
                              className="font-bold text-red-700 hover:underline"
                            >
                              {review.reportCount}
                            </Link>
                          ) : (
                            <span className="text-stone-400">0</span>
                          )}
                        </td>
                        <td className="admin-td">
                          <span className={`badge ${review.hidden ? 'badge-neutral' : 'badge-ok'}`}>
                            {review.hidden ? '숨김' : '노출중'}
                          </span>
                        </td>
                        <td className="admin-td">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : review.id)}
                              className="admin-btn-secondary"
                            >
                              답글
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleHide(review)}
                              disabled={actingId === review.id}
                              className={review.hidden ? 'admin-btn-secondary' : 'admin-btn-danger'}
                            >
                              {review.hidden ? '숨김 해제' : '숨기기'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-stone-50">
                          <td colSpan={8} className="px-4 pb-4 pt-1">
                            <ReplyEditor
                              review={review}
                              onSaved={(reply) => patch(review.id, { reply })}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
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

function ReplyEditor({
  review,
  onSaved,
}: {
  review: ManagedReview
  onSaved: (reply: ManagedReview['reply']) => void
}) {
  const toast = useToast()
  const [content, setContent] = useState(review.reply?.content ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const { data } = await (review.reply ? updateReply : createReply)(
        review.hospitalId,
        review.id,
        content.trim(),
      )
      onSaved(data.data)
      toast(review.reply ? '답글을 수정했어요.' : '답글을 등록했어요.')
    } catch (err) {
      toast(errorMessage(err, '답글 저장에 실패했습니다.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('답글을 삭제할까요?')) return
    setSaving(true)
    try {
      await deleteReply(review.hospitalId, review.id)
      onSaved(null)
      setContent('')
      toast('답글을 삭제했어요.')
    } catch (err) {
      toast(errorMessage(err, '답글 삭제에 실패했습니다.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold text-stone-500">
        병원 답글
        {review.reply && (
          <span className="ml-2 font-normal text-stone-400">
            {formatDateTime(review.reply.createdAt)} 작성
          </span>
        )}
      </p>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="리뷰에 대한 답글을 입력하세요"
        aria-label="병원 답글"
        className="admin-input h-auto w-full py-2"
      />
      <div className="mt-2 flex justify-end gap-2">
        {review.reply && (
          <button type="button" onClick={remove} disabled={saving} className="admin-btn-danger">
            답글 삭제
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || !content.trim() || content.trim() === review.reply?.content}
          className="admin-btn-primary"
        >
          {review.reply ? '답글 수정' : '답글 등록'}
        </button>
      </div>
    </div>
  )
}
