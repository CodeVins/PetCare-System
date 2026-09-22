import {
  Buildings,
  CalendarCheck,
  CheckCircle,
  Clock,
  Flag,
  PawPrint,
  Users,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getHospitalStats,
  getReviewReports,
  getStatsSummary,
  runReminders,
} from '../../api/adminApi'
import { getAdminReservations } from '../../api/reservationAdminApi'
import Alert from '../../components/common/Alert'
import AdminPageHeader from './AdminPageHeader'
import StatTile from './StatTile'

const SUMMARY_TILES = [
  { key: 'totalUsers', label: '전체 사용자', icon: Users },
  { key: 'totalPets', label: '등록된 반려동물', icon: PawPrint },
  { key: 'totalHospitals', label: '등록된 병원', icon: Buildings },
  { key: 'totalReservations', label: '전체 예약', icon: CalendarCheck },
  { key: 'confirmedReservations', label: '확정 예약', icon: CheckCircle },
  { key: 'cancelledReservations', label: '취소 예약', icon: XCircle },
  { key: 'noShowReservations', label: '노쇼', icon: WarningCircle },
]

export default function AdminOverviewPage() {
  const [summary, setSummary] = useState(null)
  const [hospitalStats, setHospitalStats] = useState([])
  const [pendingCount, setPendingCount] = useState(null)
  const [reportCount, setReportCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reminderRunning, setReminderRunning] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')

  useEffect(() => {
    Promise.all([
      getStatsSummary(),
      getHospitalStats(),
      getAdminReservations('PENDING'),
      getReviewReports(),
    ])
      .then(([summaryRes, hospitalStatsRes, pendingRes, reportsRes]) => {
        setSummary(summaryRes.data.data)
        setHospitalStats(hospitalStatsRes.data.data)
        setPendingCount(pendingRes.data.data.totalElements)
        setReportCount(reportsRes.data.data.content.filter((r) => !r.reviewHidden).length)
      })
      .catch((err) => setError(err.response?.data?.message || '통계를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleRunReminders = async () => {
    setReminderRunning(true)
    setReminderMessage('')
    try {
      await runReminders()
      setReminderMessage('리마인더를 발송했습니다.')
    } catch (err) {
      setReminderMessage(err.response?.data?.message || '실행에 실패했습니다.')
    } finally {
      setReminderRunning(false)
    }
  }

  const topHospitals = [...hospitalStats]
    .sort((a, b) => b.reservationCount - a.reservationCount)
    .slice(0, 5)
  const maxReservationCount = Math.max(1, ...topHospitals.map((h) => h.reservationCount))

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="대시보드" description="펫케어 운영 현황을 한눈에 확인하세요" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="대시보드" />
        <Alert tone="error">{error}</Alert>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="대시보드" description="펫케어 운영 현황을 한눈에 확인하세요" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SUMMARY_TILES.map(({ key, label, icon }) => (
          <StatTile key={key} icon={icon} label={label} value={summary[key]} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="admin-card p-5 lg:col-span-2" aria-labelledby="h-top-hospitals">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="h-top-hospitals" className="text-sm font-bold text-stone-700">
              병원별 예약 순위
            </h2>
            <Link
              to="/admin/stats"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              전체 통계
            </Link>
          </div>

          {topHospitals.length === 0 ? (
            <p className="text-sm text-stone-500">아직 예약 데이터가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {topHospitals.map((hospital) => (
                <li key={hospital.hospitalId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="min-w-0 truncate font-medium text-stone-800">
                      {hospital.hospitalName}
                    </span>
                    <span className="shrink-0 text-stone-500">
                      예약 {hospital.reservationCount}건
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{
                        width: `${(hospital.reservationCount / maxReservationCount) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="admin-card p-5" aria-labelledby="h-attention">
            <h2 id="h-attention" className="mb-3 text-sm font-bold text-stone-700">
              처리가 필요해요
            </h2>
            <div className="flex flex-col gap-2">
              <Link
                to="/admin/reservations"
                className="flex items-center justify-between rounded-lg border border-stone-200 px-3.5 py-3 text-sm transition-colors hover:bg-stone-50"
              >
                <span className="flex items-center gap-2 text-stone-700">
                  <Clock size={18} className="text-amber-600" />
                  대기중인 예약
                </span>
                <span className="font-bold text-stone-900">{pendingCount}건</span>
              </Link>
              <Link
                to="/admin/reviews"
                className="flex items-center justify-between rounded-lg border border-stone-200 px-3.5 py-3 text-sm transition-colors hover:bg-stone-50"
              >
                <span className="flex items-center gap-2 text-stone-700">
                  <Flag size={18} className="text-red-600" />
                  처리 안 된 리뷰 신고
                </span>
                <span className="font-bold text-stone-900">{reportCount}건</span>
              </Link>
            </div>
          </section>

          <section className="admin-card p-5" aria-labelledby="h-reminder">
            <h2 id="h-reminder" className="mb-1 text-sm font-bold text-stone-700">
              리마인더 수동 실행
            </h2>
            <p className="mb-3 text-[13px] text-stone-500">
              접종/예약 리마인더 알림을 지금 바로 발송합니다.
            </p>
            {reminderMessage && (
              <Alert tone="ok" className="mb-3">
                {reminderMessage}
              </Alert>
            )}
            <button
              type="button"
              onClick={handleRunReminders}
              disabled={reminderRunning}
              className="admin-btn-primary w-full"
            >
              {reminderRunning ? '실행 중...' : '지금 실행'}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
