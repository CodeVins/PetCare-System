import { useEffect, useState } from 'react'
import { getHospitalStats, getStatsSummary, runReminders } from '../../api/adminApi'
import Button from '../../components/common/Button'
import ReviewModerationSection from './ReviewModerationSection'
import UserManagementSection from './UserManagementSection'

const SUMMARY_LABELS = {
  totalUsers: '전체 사용자',
  totalPets: '등록 반려동물',
  totalHospitals: '병원',
  totalReservations: '전체 예약',
  confirmedReservations: '확정 예약',
  cancelledReservations: '취소 예약',
  noShowReservations: '노쇼',
}

export default function AdminPage() {
  const [summary, setSummary] = useState(null)
  const [hospitalStats, setHospitalStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reminderRunning, setReminderRunning] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')

  useEffect(() => {
    Promise.all([getStatsSummary(), getHospitalStats()])
      .then(([summaryRes, hospitalStatsRes]) => {
        setSummary(summaryRes.data.data)
        setHospitalStats(hospitalStatsRes.data.data)
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">관리자</h1>

      {loading && <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && summary && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-700">전체 현황</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(SUMMARY_LABELS).map(([key, label]) => (
              <div key={key} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs text-stone-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{summary[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && hospitalStats.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-700">병원별 현황</h2>
          <div className="space-y-2">
            {hospitalStats.map((hospital) => (
              <div
                key={hospital.hospitalId}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4"
              >
                <p className="font-medium text-stone-900">{hospital.hospitalName}</p>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <span>예약 {hospital.reservationCount}</span>
                  <span>리뷰 {hospital.reviewCount}</span>
                  {hospital.averageRating != null && (
                    <span>★ {hospital.averageRating.toFixed(1)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-700">리마인더 수동 실행</h2>
        <p className="text-xs text-stone-500">
          예방접종/예약 리마인더 알림을 지금 바로 발송합니다.
        </p>
        {reminderMessage && <p className="text-sm text-brand-700">{reminderMessage}</p>}
        <Button type="button" onClick={handleRunReminders} loading={reminderRunning}>
          지금 실행
        </Button>
      </div>

      <UserManagementSection />

      <ReviewModerationSection />
    </div>
  )
}
