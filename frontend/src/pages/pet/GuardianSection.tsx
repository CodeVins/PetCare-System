import { UserCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getGuardians,
  inviteGuardian,
  leaveGuardian,
  removeGuardian,
} from '../../api/petGuardianApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
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

  useEffect(() => {
    getGuardians(petId)
      .then(({ data }) => setGuardians(data.data))
      .catch((err) =>
        setError(err.response?.data?.message || '보호자 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
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
    <div className="flex flex-col gap-4">
      {isOwner && (
        <form
          onSubmit={handleInvite}
          className="card flex flex-col gap-3 p-5 md:p-6"
          aria-labelledby="h-guardian-invite"
        >
          <h2 id="h-guardian-invite" className="h-section">
            공동보호자 초대
          </h2>
          <p className="text-[13px] text-stone-600">
            함께 돌보는 가족의 이메일을 입력하면 이 아이의 기록을 같이 볼 수 있어요.
          </p>
          <TextField
            label="이메일"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="family@example.com"
            required
          />
          <Alert tone="error">{inviteError}</Alert>
          <Button type="submit" loading={inviting} className="w-full">
            초대하기
          </Button>
        </form>
      )}

      <section className="card p-5 md:p-6" aria-labelledby="h-guardian-list">
        <h2 id="h-guardian-list" className="h-section mb-2">
          현재 보호자
        </h2>

        {loading && <div className="h-16 animate-pulse rounded-xl bg-stone-100" />}
        {!loading && error && <Alert tone="error">{error}</Alert>}

        {!loading && !error && guardians.length === 0 && (
          <EmptyState icon={UserCircle}>등록된 공동보호자가 없습니다.</EmptyState>
        )}

        {!loading && !error && guardians.length > 0 && (
          <ul className="flex flex-col">
            {guardians.map((guardian) => (
              <li
                key={guardian.userId}
                className="flex items-center gap-3 border-b border-stone-100 py-2.5 last:border-0"
              >
                <span className="icon-badge bg-stone-100 text-stone-700">
                  <UserCircle size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-bold">{guardian.email}</span>
                  <span className="text-[13px] text-stone-600">공동보호자</span>
                </span>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemove(guardian.userId)}
                    disabled={actingUserId === guardian.userId}
                    className="chip h-11 font-bold text-red-700 disabled:opacity-50"
                  >
                    내보내기
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isOwner && (
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaving}
          className="btn btn-danger w-full disabled:opacity-50"
        >
          공동보호자에서 나가기
        </button>
      )}
    </div>
  )
}
