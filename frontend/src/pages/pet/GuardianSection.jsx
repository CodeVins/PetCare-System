import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGuardians,
  inviteGuardian,
  leaveGuardian,
  removeGuardian,
} from '../../api/petGuardianApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

export default function GuardianSection({ petId, isOwner }) {
  const [guardians, setGuardians] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const [actingUserId, setActingUserId] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const navigate = useNavigate()

  const load = () => {
    getGuardians(petId)
      .then(({ data }) => setGuardians(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || '보호자 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId])

  const handleInvite = async (event) => {
    event.preventDefault()
    setInviteError('')
    setInviting(true)
    try {
      const { data } = await inviteGuardian(petId, email)
      setGuardians((prev) => [...prev, data.data])
      setEmail('')
    } catch (err) {
      setInviteError(err.response?.data?.message || '초대에 실패했습니다.')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (userId) => {
    if (!window.confirm('이 보호자를 내보낼까요?')) return
    setActingUserId(userId)
    try {
      await removeGuardian(petId, userId)
      setGuardians((prev) => prev.filter((guardian) => guardian.userId !== userId))
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
    } finally {
      setActingUserId(null)
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('이 반려동물의 공동보호자에서 나갈까요?')) return
    setLeaving(true)
    try {
      await leaveGuardian(petId)
      navigate('/pets', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.')
      setLeaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-stone-700">공동보호자</h2>

      {loading && <div className="h-16 animate-pulse rounded-2xl bg-stone-100" />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && guardians.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
          등록된 공동보호자가 없습니다.
        </p>
      )}

      {!loading && !error && guardians.length > 0 && (
        <div className="space-y-2">
          {guardians.map((guardian) => (
            <div
              key={guardian.userId}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4"
            >
              <p className="truncate text-sm text-stone-900">{guardian.email}</p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(guardian.userId)}
                  disabled={actingUserId === guardian.userId}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  내보내기
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner ? (
        <form
          onSubmit={handleInvite}
          className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <TextField
            label="보호자로 초대할 이메일"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@email.com"
            required
          />
          {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
          <Button type="submit" loading={inviting} className="w-full">
            초대하기
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaving}
          className="w-full rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          공동보호자에서 나가기
        </button>
      )}
    </div>
  )
}
