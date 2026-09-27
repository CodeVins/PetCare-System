import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { activateUser, getAllUsers, suspendUser, updateUserRole } from '../../api/adminApi'
import Alert from '../../components/common/Alert'
import { useAuth } from '../../hooks/useAuth'
import AdminPageHeader from './AdminPageHeader'

const ROLE_OPTIONS = ['USER', 'HOSPITAL_OWNER', 'ADMIN']
const ROLE_FILTERS = [
  { value: '', label: '전체 역할' },
  ...ROLE_OPTIONS.map((role) => ({ value: role, label: role })),
]

export default function AdminUsersPage() {
  const { userId: myUserId } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [suspendedOnly, setSuspendedOnly] = useState(false)

  useEffect(() => {
    getAllUsers()
      .then(({ data }) => setUsers(data.data.content))
      .catch((err) =>
        setError(err.response?.data?.message || '사용자 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, role) => {
    setUpdatingUserId(userId)
    try {
      const { data } = await updateUserRole(userId, role)
      setUsers((prev) => prev.map((user) => (user.id === userId ? data.data : user)))
    } catch (err) {
      setError(err.response?.data?.message || '역할 변경에 실패했습니다.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleToggleSuspend = async (user) => {
    setUpdatingUserId(user.id)
    try {
      const { data } = user.suspended
        ? await activateUser(user.id)
        : await suspendUser(user.id)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data.data : u)))
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const rows = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false
      if (suspendedOnly && !user.suspended) return false
      if (keyword.trim() && !user.email.toLowerCase().includes(keyword.trim().toLowerCase()))
        return false
      return true
    })
  }, [users, keyword, roleFilter, suspendedOnly])

  return (
    <div>
      <AdminPageHeader
        title="사용자"
        description={`전체 ${users.length}명 · 필터링된 ${rows.length}명`}
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="이메일 검색"
              aria-label="이메일 검색"
              className="admin-input w-full pl-9 sm:w-64"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ROLE_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={roleFilter === option.value}
                onClick={() => setRoleFilter(option.value)}
                className={`admin-btn ${
                  roleFilter === option.value
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {option.label}
              </button>
            ))}
            <label className="ml-1 flex items-center gap-1.5 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={suspendedOnly}
                onChange={(event) => setSuspendedOnly(event.target.checked)}
                className="accent-brand-600"
              />
              정지된 계정만
            </label>
          </div>
        </div>

        {loading && <div className="h-40 animate-pulse bg-stone-100" />}
        {!loading && error && (
          <div className="p-5">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <p className="p-5 text-sm text-stone-500">조건에 맞는 사용자가 없습니다.</p>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-stone-50">
                  <th scope="col" className="admin-th">
                    ID
                  </th>
                  <th scope="col" className="admin-th">
                    이메일
                  </th>
                  <th scope="col" className="admin-th">
                    역할
                  </th>
                  <th scope="col" className="admin-th">
                    상태
                  </th>
                  <th scope="col" className="admin-th text-right">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((user) => {
                  const isSelf = user.id === myUserId
                  const rowUpdating = updatingUserId === user.id
                  return (
                    <tr key={user.id} className="hover:bg-stone-50">
                      <td className="admin-td text-stone-500">{user.id}</td>
                      <td className="admin-td font-medium text-stone-900">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="hover:text-brand-600 hover:underline"
                        >
                          {user.email}
                        </Link>
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-stone-400">
                            (나)
                          </span>
                        )}
                      </td>
                      <td className="admin-td">
                        <select
                          value={user.role}
                          disabled={isSelf || rowUpdating}
                          onChange={(event) => handleRoleChange(user.id, event.target.value)}
                          className="admin-input py-1 disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="admin-td">
                        {user.suspended ? (
                          <span className="badge badge-danger">정지됨</span>
                        ) : (
                          <span className="badge badge-ok">정상</span>
                        )}
                      </td>
                      <td className="admin-td text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/users/${user.id}`} className="admin-btn-secondary">
                            상세
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleSuspend(user)}
                            disabled={isSelf || rowUpdating}
                            className={user.suspended ? 'admin-btn-primary' : 'admin-btn-danger'}
                          >
                            {user.suspended ? '정지 해제' : '정지'}
                          </button>
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
