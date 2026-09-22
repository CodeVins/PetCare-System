import { ArrowSquareOut, MagnifyingGlass, Star } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllUsers, updateHospitalOwner } from '../../api/adminApi'
import { createHospital, getHospitals } from '../../api/hospitalApi'
import Alert from '../../components/common/Alert'
import AdminPageHeader from './AdminPageHeader'

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')

  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [ownerHospitalId, setOwnerHospitalId] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [ownerSaving, setOwnerSaving] = useState(false)
  const [ownerMessage, setOwnerMessage] = useState('')

  useEffect(() => {
    Promise.all([getHospitals(), getAllUsers()])
      .then(([hospitalsRes, usersRes]) => {
        setHospitals(hospitalsRes.data.data)
        setUsers(usersRes.data.data.content)
      })
      .catch((err) =>
        setError(err.response?.data?.message || '병원 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleCreateHospital = async (event) => {
    event.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const { data } = await createHospital({
        name: newName,
        address: newAddress || null,
      })
      setHospitals((prev) => [...prev, data.data])
      setNewName('')
      setNewAddress('')
    } catch (err) {
      setCreateError(err.response?.data?.message || '병원 등록에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const handleOwnerAssign = async (event) => {
    event.preventDefault()
    setOwnerMessage('')
    if (!ownerHospitalId || !ownerUserId) {
      setOwnerMessage('병원과 사용자를 모두 선택해 주세요.')
      return
    }
    setOwnerSaving(true)
    try {
      await updateHospitalOwner(ownerHospitalId, Number(ownerUserId))
      setOwnerMessage('병원 소유자를 지정했습니다. USER였다면 자동으로 HOSPITAL_OWNER로 승격됩니다.')
    } catch (err) {
      setOwnerMessage(err.response?.data?.message || '지정에 실패했습니다.')
    } finally {
      setOwnerSaving(false)
    }
  }

  const rows = useMemo(
    () =>
      hospitals.filter((h) => h.name.toLowerCase().includes(keyword.trim().toLowerCase())),
    [hospitals, keyword],
  )

  return (
    <div>
      <AdminPageHeader title="병원" description={`등록된 병원 ${hospitals.length}곳`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="admin-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 p-5">
            <h2 className="text-sm font-bold text-stone-700">병원 목록</h2>
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="병원 이름 검색"
                aria-label="병원 이름 검색"
                className="admin-input w-48 pl-9"
              />
            </div>
          </div>

          {loading && <div className="h-40 animate-pulse bg-stone-100" />}
          {!loading && error && (
            <div className="p-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <p className="p-5 text-sm text-stone-500">조건에 맞는 병원이 없습니다.</p>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-stone-50">
                    <th scope="col" className="admin-th">
                      병원명
                    </th>
                    <th scope="col" className="admin-th">
                      주소
                    </th>
                    <th scope="col" className="admin-th text-right">
                      평점
                    </th>
                    <th scope="col" className="admin-th text-right">
                      리뷰
                    </th>
                    <th scope="col" className="admin-th text-right">
                      바로가기
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-stone-50">
                      <td className="admin-td font-medium text-stone-900">{hospital.name}</td>
                      <td className="admin-td text-stone-600">{hospital.address || '—'}</td>
                      <td className="admin-td text-right">
                        {hospital.averageRating != null ? (
                          <span className="inline-flex items-center justify-end gap-1 text-amber-600">
                            <Star weight="fill" size={14} />
                            {hospital.averageRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="admin-td text-right">{hospital.reviewCount}</td>
                      <td className="admin-td text-right">
                        <Link
                          to={`/hospitals/${hospital.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          보기
                          <ArrowSquareOut size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <form onSubmit={handleCreateHospital} className="admin-card flex flex-col gap-3 p-5">
            <h2 className="text-sm font-bold text-stone-700">병원 등록</h2>
            <p className="text-[13px] text-stone-500">
              위경도·운영시간·24시간·주차·진료비·사진은 등록 후 병원 소유자가 직접
              관리 화면에서 편집합니다.
            </p>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700">병원 이름</span>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                required
                className="admin-input w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700">주소</span>
              <input
                value={newAddress}
                onChange={(event) => setNewAddress(event.target.value)}
                className="admin-input w-full"
              />
            </label>
            <Alert tone="error">{createError}</Alert>
            <button type="submit" disabled={creating} className="admin-btn-primary">
              {creating ? '등록 중...' : '등록하기'}
            </button>
          </form>

          <form onSubmit={handleOwnerAssign} className="admin-card flex flex-col gap-3 p-5">
            <h2 className="text-sm font-bold text-stone-700">병원 소유자 지정</h2>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700">병원</span>
              <select
                value={ownerHospitalId}
                onChange={(event) => setOwnerHospitalId(event.target.value)}
                className="admin-input w-full"
              >
                <option value="">병원 선택</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700">사용자</span>
              <select
                value={ownerUserId}
                onChange={(event) => setOwnerUserId(event.target.value)}
                className="admin-input w-full"
              >
                <option value="">사용자 선택</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.role})
                  </option>
                ))}
              </select>
            </label>
            {ownerMessage && (
              <Alert tone={ownerMessage.includes('지정했습니다') ? 'ok' : 'error'}>
                {ownerMessage}
              </Alert>
            )}
            <button type="submit" disabled={ownerSaving} className="admin-btn-primary">
              {ownerSaving ? '지정 중...' : '지정하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
