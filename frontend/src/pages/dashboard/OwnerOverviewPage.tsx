import {
  CalendarBlank,
  CalendarCheck,
  ChatText,
  Clock,
  Flag,
  Star,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getManagedReviews, getReviewReports } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import { getSlots } from '../../api/hospitalApi'
import { getAdminReservations } from '../../api/reservationAdminApi'
import Alert from '../../components/common/Alert'
import Stars from '../../components/common/Stars'
import { formatDateLabel, formatDateTime, formatSlot, reservationPetCaption } from '../../lib/format'
import type { ManagedReview, Reservation, Slot } from '../../types/api'
import AdminPageHeader from '../admin/AdminPageHeader'
import StatTile from '../admin/StatTile'
import { useOwnerHospital } from './OwnerLayout'

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 앞으로 7일(오늘 포함) 날짜별 슬롯 예약률 — 슬롯 API가 지난 슬롯을 빼고 주므로 오늘은 남은 시간대 기준
function slotsByDay(slots: Slot[]) {
  const days: { key: string; total: number; reserved: number }[] = []
  const start = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const daySlots = slots.filter((s) => s.startTime.startsWith(key))
    days.push({
      key,
      total: daySlots.length,
      reserved: daySlots.filter((s) => s.status === 'RESERVED').length,
    })
  }
  return days
}

export default function OwnerOverviewPage() {
  const { hospital } = useOwnerHospital()
  const [pending, setPending] = useState<Reservation[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [slots, setSlots] = useState<Slot[]>([])
  const [reviews, setReviews] = useState<ManagedReview[]>([])
  const [openReports, setOpenReports] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getAdminReservations('PENDING'),
      getSlots(hospital.id),
      getManagedReviews({ hospitalId: hospital.id }),
      getReviewReports({ hospitalId: hospital.id, hidden: false }),
    ])
      .then(([pendingRes, slotsRes, reviewsRes, reportsRes]) => {
        setPending(pendingRes.data.data.content.slice(0, 5))
        setPendingCount(pendingRes.data.data.totalElements)
        setSlots(slotsRes.data.data.content)
        setReviews(reviewsRes.data.data.content.slice(0, 5))
        setOpenReports(reportsRes.data.data.totalElements)
      })
      .catch((err) => setError(errorMessage(err, '현황을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [hospital.id])

  const today = todayKey()
  const todayReserved = slots.filter(
    (s) => s.startTime.startsWith(today) && s.status === 'RESERVED',
  ).length
  const available = slots.filter((s) => s.status === 'AVAILABLE').length
  const week = slotsByDay(slots)
  const weekMax = Math.max(1, ...week.map((d) => d.total))

  return (
    <div>
      <AdminPageHeader
        title={hospital.name}
        description={hospital.address ?? '병원 운영 현황'}
        action={
          <Link to={`/hospitals/${hospital.id}`} className="admin-btn-secondary">
            병원 페이지 보기
          </Link>
        }
      />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          icon={Clock}
          label="승인 대기 예약"
          value={loading ? '—' : `${pendingCount}건`}
          tone={pendingCount > 0 ? 'text-amber-700' : undefined}
        />
        <StatTile icon={CalendarCheck} label="오늘 남은 예약" value={loading ? '—' : `${todayReserved}건`} />
        <StatTile icon={CalendarBlank} label="예약 가능 슬롯" value={loading ? '—' : `${available}개`} />
        <StatTile
          icon={Star}
          label={`평균 평점 · 리뷰 ${hospital.reviewCount}개`}
          value={hospital.averageRating != null ? hospital.averageRating.toFixed(1) : '—'}
        />
        <StatTile
          icon={Flag}
          label="처리 안 된 신고"
          value={loading ? '—' : `${openReports}건`}
          tone={openReports > 0 ? 'text-red-700' : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="admin-card overflow-hidden" aria-labelledby="h-pending">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <h2 id="h-pending" className="text-sm font-bold text-stone-800">
              승인 대기 예약
            </h2>
            <Link to="/dashboard/reservations" className="text-xs font-semibold text-brand-700 hover:underline">
              전체 보기
            </Link>
          </div>
          {loading ? (
            <div className="h-40 animate-pulse bg-stone-100" />
          ) : pending.length === 0 ? (
            <p className="p-5 text-sm text-stone-500">대기 중인 예약이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {pending.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-stone-900">{formatSlot(r)}</span>
                    <span className="block truncate text-xs text-stone-500">
                      {r.petName ? reservationPetCaption(r) : `반려동물 ID ${r.petId}`}
                      {r.hospitalId !== hospital.id && ` · ${r.hospitalName}`}
                    </span>
                  </span>
                  <span className="badge badge-wait shrink-0">대기중</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card p-5" aria-labelledby="h-week">
          <h2 id="h-week" className="mb-1 text-sm font-bold text-stone-800">
            앞으로 7일 슬롯 예약률
          </h2>
          <p className="mb-4 text-xs text-stone-500">막대 길이 = 그날 슬롯 수, 진한 부분 = 예약된 슬롯</p>
          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-stone-100" />
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">날짜별 전체 슬롯과 예약된 슬롯 수</caption>
              <tbody>
                {week.map((day) => (
                  <tr key={day.key} title={`${formatDateLabel(day.key)} · 예약 ${day.reserved} / 전체 ${day.total}`}>
                    <th scope="row" className="w-24 py-1.5 pr-3 text-left text-xs font-medium text-stone-600">
                      {formatDateLabel(day.key)}
                    </th>
                    <td className="py-1.5">
                      <div
                        className="flex h-3 overflow-hidden rounded-sm bg-stone-100"
                        style={{ width: `${Math.max(day.total ? 8 : 0, (day.total / weekMax) * 100)}%` }}
                      >
                        <div
                          className="h-full bg-brand-600"
                          style={{ width: day.total ? `${(day.reserved / day.total) * 100}%` : 0 }}
                        />
                        <div className="h-full flex-1 border-l-2 border-white bg-brand-100" />
                      </div>
                    </td>
                    <td className="w-20 py-1.5 pl-3 text-right text-xs tabular-nums text-stone-600">
                      {day.total ? `${day.reserved} / ${day.total}` : '슬롯 없음'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to="/dashboard/slots" className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">
            슬롯 등록하러 가기
          </Link>
        </section>
      </div>

      <section className="admin-card mt-4 overflow-hidden" aria-labelledby="h-recent-reviews">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
          <h2 id="h-recent-reviews" className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
            <ChatText size={16} /> 최근 리뷰
          </h2>
          <Link to="/dashboard/reviews" className="text-xs font-semibold text-brand-700 hover:underline">
            리뷰 관리
          </Link>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-stone-100" />
        ) : reviews.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">아직 리뷰가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {reviews.map((review) => (
              <li key={review.id} className="flex items-start gap-4 px-5 py-3 text-sm">
                <span className="w-32 shrink-0 text-xs text-stone-500">{formatDateTime(review.createdAt)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <Stars value={review.rating} size={12} />
                    <span className="truncate text-xs text-stone-500">{review.authorEmail}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-stone-800">{review.content}</span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  {review.hidden && <span className="badge badge-neutral">숨김</span>}
                  {review.reportCount > 0 && <span className="badge badge-danger">신고 {review.reportCount}</span>}
                  {!review.reply && <span className="badge badge-wait">답글 대기</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
