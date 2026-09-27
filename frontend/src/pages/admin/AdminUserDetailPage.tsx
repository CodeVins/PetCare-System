import {
  CalendarCheck,
  CaretLeft,
  ChatCircleDots,
  PawPrint,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { activateUser, getAllUsers, getUserStats, suspendUser, updateUserRole } from '../../api/adminApi'
import Alert from '../../components/common/Alert'
import { useAuth } from '../../hooks/useAuth'
import AdminPageHeader from './AdminPageHeader'
import StatTile from './StatTile'

const ROLE_OPTIONS = ['USER', 'HOSPITAL_OWNER', 'ADMIN']

export default function AdminUserDetailPage() {
  const { userId } = useParams()
  const { userId: myUserId } = useAuth()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    // 단일 유저 조회 API가 없어서(ADMIN.md 기준) 전체 목록에서 찾는다 —
    // 목록 페이지가 이미 같은 방식으로 size:100을 쓰고 있어 규모상 무리 없음.
    Promise.all([getAllUsers(), getUserStats(userId)])
      .then(([usersRes, statsRes]) => {
        const found = usersRes.data.data.content.find((u) => String(u.id) === userId)
        if (!found) {
          setError('사용자를 찾을 수 없습니다.')
        } else {
          setUser(found)
        }
        setStats(statsRes.data.data)
      })
      .catch((err) =>
        setError(err.response?.data?.message || '사용자 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [userId])

  const handleRoleChange = async (role) => {
    setUpdating(true)
    setActionError('')
    try {
      const { data } = await updateUserRole(userId, role)
      setUser(data.data)
    } catch (err) {
      setActionError(err.response?.data?.message || '역할 변경에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleSuspend = async () => {
    setUpdating(true)
    setActionError('')
    try {
      const { data } = user.suspended ? await activateUser(userId) : await suspendUser(userId)
      setUser(data.data)
    } catch (err) {
      setActionError(err.response?.data?.message || '처리에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const back = (
    <Link
      to="/admin/users"
      className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-700"
    >
      <CaretLeft size={16} />
      사용자 목록
    </Link>
  )

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="사용자 상세" back={back} />
        <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div>
        <AdminPageHeader title="사용자 상세" back={back} />
        <Alert tone="error">{error || '사용자를 찾을 수 없습니다.'}</Alert>
      </div>
    )
  }

  const isSelf = user.id === myUserId
  const noShowRate =
    stats.reservationCount > 0
      ? `${((stats.noShowCount / stats.reservationCount) * 100).toFixed(0)}%`
      : '—'

  return (
    <div>
      <AdminPageHeader
        title={user.email}
        description={`ID ${user.id}${isSelf ? ' · 내 계정' : ''}`}
        back={back}
      />

      <div className="admin-card mb-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {user.suspended ? (
            <span className="badge badge-danger">정지됨</span>
          ) : (
            <span className="badge badge-ok">정상</span>
          )}
          <label className="flex items-center gap-2 text-sm text-stone-600">
            역할
            <select
              value={user.role}
              disabled={isSelf || updating}
              onChange={(event) => handleRoleChange(event.target.value)}
              className="admin-input disabled:opacity-50"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={handleToggleSuspend}
          disabled={isSelf || updating}
          className={user.suspended ? 'admin-btn-primary' : 'admin-btn-danger'}
        >
          {user.suspended ? '정지 해제' : '계정 정지'}
        </button>
      </div>

      {isSelf && (
        <Alert tone="info" className="mb-4">
          본인 계정은 역할 변경·정지를 할 수 없습니다.
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4">
          {actionError}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile icon={CalendarCheck} label="예약 횟수" value={stats.reservationCount} />
        <StatTile
          icon={WarningCircle}
          label="노쇼 횟수"
          value={`${stats.noShowCount} (${noShowRate})`}
        />
        <StatTile icon={ChatCircleDots} label="작성한 리뷰 답글" value={stats.replyCount} />
        <StatTile icon={PawPrint} label="등록한 반려동물" value={stats.petCount} />
        <StatTile icon={UsersThree} label="내 펫의 공동보호자 수" value={stats.guardianCount} />
      </div>
    </div>
  )
}
