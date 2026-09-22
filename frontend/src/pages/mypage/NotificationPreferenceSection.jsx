import { useEffect, useId, useState } from 'react'
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from '../../api/notificationApi'
import Alert from '../../components/common/Alert'
import Toggle from '../../components/common/Toggle'

const CATEGORY = {
  RESERVATION: ['예약', '예약 확정, 거절, 취소, 리마인더'],
  VACCINATION: ['접종', '접종 예정일이 다가올 때'],
  FAVORITE: ['즐겨찾기 병원', '즐겨찾기한 병원의 소식'],
  CHAT: ['채팅', '병원에서 온 새 메시지'],
  WAITLIST: ['대기자 명단', '대기한 시간에 자리가 났을 때'],
}

export default function NotificationPreferenceSection() {
  const [preferences, setPreferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingCategory, setUpdatingCategory] = useState(null)
  const idPrefix = useId()

  useEffect(() => {
    getNotificationPreferences()
      .then(({ data }) => setPreferences(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || '알림 설정을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (category, enabled) => {
    setUpdatingCategory(category)
    setError('')
    // 토글은 바로 반영하고, 실패하면 되돌린다
    setPreferences((prev) =>
      prev.map((pref) => (pref.category === category ? { ...pref, enabled } : pref)),
    )
    try {
      await updateNotificationPreference(category, enabled)
    } catch (err) {
      setPreferences((prev) =>
        prev.map((pref) =>
          pref.category === category ? { ...pref, enabled: !enabled } : pref,
        ),
      )
      setError(err.response?.data?.message || '변경에 실패했습니다.')
    } finally {
      setUpdatingCategory(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-stone-600">
        받고 싶은 알림만 골라 보세요. 바꾸면 바로 저장돼요.
      </p>

      {loading && <div className="h-60 animate-pulse rounded-2xl bg-stone-100" />}
      <Alert tone="error">{error}</Alert>

      {!loading && preferences.length > 0 && (
        <div className="card px-4">
          {preferences.map((pref) => {
            const [label, description] = CATEGORY[pref.category] ?? [pref.category, '']
            const labelId = `${idPrefix}-${pref.category}`
            return (
              <div
                key={pref.category}
                className="flex items-center gap-3 border-b border-stone-100 py-4 last:border-0"
              >
                <span className="flex flex-1 flex-col">
                  <span id={labelId} className="font-bold">
                    {label}
                  </span>
                  {description && (
                    <span className="text-[13px] text-stone-600">{description}</span>
                  )}
                </span>
                <Toggle
                  checked={pref.enabled}
                  labelledBy={labelId}
                  disabled={updatingCategory === pref.category}
                  onChange={(next) => handleToggle(pref.category, next)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
