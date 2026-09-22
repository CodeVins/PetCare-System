import { useEffect, useState } from 'react'
import { getSlotIndex } from '../../api/reservationApi'
import {
  confirmReservation,
  getAdminReservations,
  noShowReservation,
  rejectReservation,
} from '../../api/reservationAdminApi'
import Alert from '../../components/common/Alert'
import StatusBadge from '../../components/common/StatusBadge'
import { formatSlot, RESERVATION_TYPE_LABEL, reservationPetCaption } from '../../lib/format'
import AdminPageHeader from './AdminPageHeader'

const FILTERS = [
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

export default function AdminReservationsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [reservations, setReservations] = useState([])
  const [index, setIndex] = useState({ slotMap: {}, hospitalNameBySlot: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    // ADMIN은 병원 전체, HOSPITAL_OWNER는 본인 병원만 — 서버가 이미 스코핑해서 내려준다.
    Promise.all([getAdminReservations(statusFilter || undefined), getSlotIndex()])
      .then(([reservationsRes, slotIndex]) => {
        setIndex(slotIndex)
        setReservations(reservationsRes.data.data.content)
      })
      .catch((err) =>
        setError(err.response?.data?.message || '예약 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleAction = async (reservationId, action) => {
    setActingId(reservationId)
    try {
      await ACTION_FNS[action](reservationId)
      setReservations((prev) => prev.filter((r) => r.id !== reservationId))
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
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
                  const slot = index.slotMap[reservation.slotId]
                  const acting = actingId === reservation.id
                  return (
                    <tr key={reservation.id} className="hover:bg-stone-50">
                      <td className="admin-td font-medium text-stone-900">
                        {index.hospitalNameBySlot[reservation.slotId] || '병원 정보 없음'}
                      </td>
                      <td className="admin-td text-stone-600">
                        {slot ? formatSlot(slot) : '시간 정보 없음'}
                      </td>
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
      </div>
    </div>
  )
}
