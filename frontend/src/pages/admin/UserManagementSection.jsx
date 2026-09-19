import { useEffect, useState } from 'react'
import {
  activateUser,
  getAllUsers,
  suspendUser,
  updateHospitalOwner,
  updateUserRole,
} from '../../api/adminApi'
import { createHospital, getHospitals } from '../../api/hospitalApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

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

  const [newHospitalName, setNewHospitalName] = useState('')
  const [newHospitalAddress, setNewHospitalAddress] = useState('')
  const [creatingHospital, setCreatingHospital] = useState(false)
  const [createHospitalError, setCreateHospitalError] = useState('')

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

  const handleToggleSuspend = async (user) => {
    setUpdatingUserId(user.id)
    try {
      const { data } = user.suspended ? await activateUser(user.id) : await suspendUser(user.id)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data.data : u)))
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleCreateHospital = async (event) => {
    event.preventDefault()
    setCreateHospitalError('')
    setCreatingHospital(true)
    try {
      const { data } = await createHospital({
        name: newHospitalName,
        address: newHospitalAddress || null,
      })
      setHospitals((prev) => [...prev, data.data])
      setNewHospitalName('')
      setNewHospitalAddress('')
    } catch (err) {
      setCreateHospitalError(err.response?.data?.message || '병원 등록에 실패했습니다.')
    } finally {
      setCreatingHospital(false)
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
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-stone-900">{user.email}</p>
                    {user.suspended && (
                      <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        정지됨
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">ID: {user.id}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
                  <button
                    type="button"
                    onClick={() => handleToggleSuspend(user)}
                    disabled={updatingUserId === user.id}
                    className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {user.suspended ? '정지 해제' : '정지'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleCreateHospital}
        className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-700">병원 등록</h2>
        <p className="text-xs text-stone-500">
          위경도·운영시간·24시간·주차·진료비·사진은 등록 후 대시보드에서 편집할 수
          있어요.
        </p>
        <TextField
          label="병원 이름"
          value={newHospitalName}
          onChange={(event) => setNewHospitalName(event.target.value)}
          required
        />
        <TextField
          label="주소"
          value={newHospitalAddress}
          onChange={(event) => setNewHospitalAddress(event.target.value)}
        />
        {createHospitalError && <p className="text-sm text-red-600">{createHospitalError}</p>}
        <Button type="submit" loading={creatingHospital}>
          등록하기
        </Button>
      </form>

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
