import { useEffect, useState } from 'react'
import { getAllUsers, updateHospitalOwner, updateUserRole } from '../../api/adminApi'
import { getHospitals } from '../../api/hospitalApi'
import Button from '../../components/common/Button'

const ROLE_OPTIONS = ['USER', 'HOSPITAL_OWNER', 'ADMIN']

const selectClassName =
  'rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50'

export default function UserManagementSection() {
  const [users, setUsers] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const [ownerHospitalId, setOwnerHospitalId] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [ownerSaving, setOwnerSaving] = useState(false)
  const [ownerMessage, setOwnerMessage] = useState('')

  useEffect(() => {
    Promise.all([getAllUsers(), getHospitals()])
      .then(([usersRes, hospitalsRes]) => {
        setUsers(usersRes.data.data.content)
        setHospitals(hospitalsRes.data.data)
      })
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

  const handleOwnerAssign = async (event) => {
    event.preventDefault()
    setOwnerMessage('')
    if (!ownerHospitalId || !ownerUserId) {
      setOwnerMessage('병원과 사용자를 모두 선택해주세요.')
      return
    }
    setOwnerSaving(true)
    try {
      await updateHospitalOwner(ownerHospitalId, Number(ownerUserId))
      setOwnerMessage('병원 소유자를 지정했습니다.')
    } catch (err) {
      setOwnerMessage(err.response?.data?.message || '지정에 실패했습니다.')
    } finally {
      setOwnerSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-700">사용자 관리</h2>

        {loading && <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{user.email}</p>
                  <p className="text-xs text-stone-400">ID: {user.id}</p>
                </div>
                <select
                  value={user.role}
                  onChange={(event) => handleRoleChange(user.id, event.target.value)}
                  disabled={updatingUserId === user.id}
                  className={selectClassName}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleOwnerAssign}
        className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-700">병원 소유자 지정</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={ownerHospitalId}
            onChange={(event) => setOwnerHospitalId(event.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">병원 선택</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
          <select
            value={ownerUserId}
            onChange={(event) => setOwnerUserId(event.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">사용자 선택</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </div>
        {ownerMessage && <p className="text-sm text-brand-700">{ownerMessage}</p>}
        <Button type="submit" loading={ownerSaving}>
          지정하기
        </Button>
      </form>
    </div>
  )
}
