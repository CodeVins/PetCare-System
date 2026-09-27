import { errorMessage } from '../../api/axiosInstance'
import { useState } from 'react'
import {
  confirmReservation,
  getAdminReservations,
  noShowReservation,
  rejectReservation,
} from '../../api/reservationAdminApi'
import Alert from '../../components/common/Alert'
import StatusBadge from '../../components/common/StatusBadge'
import { usePagedList } from '../../hooks/usePagedList'
import { useToast } from '../../hooks/useToast'
import { formatSlot, RESERVATION_TYPE_LABEL, reservationPetCaption } from '../../lib/format'
import type { ReservationStatus } from '../../types/api'
import AdminPageHeader from './AdminPageHeader'

const FILTERS: { value: ReservationStatus | ''; label: string }[] = [
  { value: 'PENDING', label: '대기중' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'REJECTED', label: '거절됨' },
  { value: 'CANCELLED', label: '취소됨' },
  { value: 'NO_SHOW', label: '노쇼' },
  { value: '', label: '전체' },
]

const ACTION_FNS = {
  confirm: confirmReservation,
  reject: rejectReservation,
  noShow: noShowReservation,
}

const ACTION_DONE = {
  confirm: '예약을 확정했어요.',
  reject: '예약을 거절했어요.',
  noShow: '노쇼로 처리했어요.',
}

export default function AdminReservationsPage() {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('PENDING')
  // ADMIN은 병원 전체, HOSPITAL_OWNER는 본인 병원만 — 서버가 이미 스코핑해서 내려준다.
  // 변경(2026-09-27): usePagedList로 "더 보기" 페이지네이션 (이전: 첫 페이지 20개만 보임)
  const {
    items: reservations,
    setItems: setReservations,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
  } = usePagedList(
    (page) => getAdminReservations(statusFilter || undefined, page),
    statusFilter,
    '예약 목록을 불러오지 못했습니다.',
  )
  const [actingId, setActingId] = useState<number | null>(null)
  const toast = useToast()

  const handleAction = async (reservationId: number, action: keyof typeof ACTION_FNS) => {
    setActingId(reservationId)
    try {
      await ACTION_FNS[action](reservationId)
      setReservations((prev) => prev.filter((r) => r.id !== reservationId))
      toast(ACTION_DONE[action])
    } catch (err) {
      // 변경(2026-09-27): 처리 실패를 토스트로 — 목록은 그대로 두고 알림만 (이전: setError로 목록 전체가 에러 문구로 바뀜)
      toast(errorMessage(err, '처리에 실패했습니다.'), 'error')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader title="예약" description="병원 예약 요청을 확인하고 처리합니다" />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-stone-100 p-5">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`admin-btn ${
                statusFilter === option.value
                  ? 'bg-stone-900 text-white'
                  : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading && <div className="h-40 animate-pulse bg-stone-100" />}
        {!loading && error && (
          <div className="p-5">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {!loading && !error && reservations.length === 0 && (
          <p className="p-5 text-sm text-stone-500">해당하는 예약이 없습니다.</p>
        )}

        {!loading && !error && reservations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-stone-50">
                  <th scope="col" className="admin-th">
                    병원
                  </th>
                  <th scope="col" className="admin-th">
                    시간
                  </th>
                  <th scope="col" className="admin-th">
                    반려동물
                  </th>
                  <th scope="col" className="admin-th">
                    진료 유형
                  </th>
                  <th scope="col" className="admin-th">
                    상태
                  </th>
                  <th scope="col" className="admin-th text-right">
                    처리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reservations.map((reservation) => {
                  const acting = actingId === reservation.id
                  return (
                    <tr key={reservation.id} className="hover:bg-stone-50">
                      <td className="admin-td font-medium text-stone-900">
                        {reservation.hospitalName}
                      </td>
                      <td className="admin-td text-stone-600">{formatSlot(reservation)}</td>
                      <td className="admin-td text-stone-600">
                        {reservation.petName ? (
                          reservationPetCaption(reservation)
                        ) : (
                          <span className="text-stone-400">ID {reservation.petId}</span>
                        )}
                      </td>
                      <td className="admin-td text-stone-600">
                        {reservation.type ? (
                          RESERVATION_TYPE_LABEL[reservation.type] ?? reservation.type
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="admin-td">
                        <StatusBadge status={reservation.status} />
                      </td>
                      <td className="admin-td">
                        <div className="flex justify-end gap-2">
                          {reservation.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAction(reservation.id, 'confirm')}
                                disabled={acting}
                                className="admin-btn-primary"
                              >
                                확정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction(reservation.id, 'reject')}
                                disabled={acting}
                                className="admin-btn-danger"
                              >
                                거절
                              </button>
                            </>
                          )}
                          {reservation.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              onClick={() => handleAction(reservation.id, 'noShow')}
                              disabled={acting}
                              className="admin-btn-secondary"
                            >
                              노쇼 처리
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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
