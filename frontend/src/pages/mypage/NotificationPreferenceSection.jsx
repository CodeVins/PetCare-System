import { useEffect, useState } from 'react'
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from '../../api/notificationApi'

const CATEGORY_LABEL = {
  RESERVATION: '예약',
  VACCINATION: '접종',
  FAVORITE: '즐겨찾기 병원',
  CHAT: '채팅',
  WAITLIST: '대기자명단',
}

export default function NotificationPreferenceSection() {
  const [preferences, setPreferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingCategory, setUpdatingCategory] = useState(null)

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
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-700">알림 설정</h2>

      {loading && <div className="h-24 animate-pulse rounded-xl bg-stone-100" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {preferences.map((pref) => (
            <label
              key={pref.category}
              className="flex items-center justify-between text-sm text-stone-700"
            >
              {CATEGORY_LABEL[pref.category] || pref.category}
              <input
                type="checkbox"
                checked={pref.enabled}
                disabled={updatingCategory === pref.category}
                onChange={(event) => handleToggle(pref.category, event.target.checked)}
                className="accent-brand-600"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
