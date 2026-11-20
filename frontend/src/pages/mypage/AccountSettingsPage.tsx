import { errorMessage } from '../../api/axiosInstance'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, getMe, updateEmail, withdraw } from '../../api/userApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import TextField from '../../components/common/TextField'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [email, setEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')

  const toast = useToast()
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getMe()
      .then(({ data }) => setEmail(data.data.email))
      .catch((err) =>
        setLoadError(errorMessage(err, '내 정보를 불러오지 못했습니다.')),
      )
      .finally(() => setLoading(false))
  }, [])

  const mismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEmailError('')
    setEmailSaving(true)
    try {
      await updateEmail(email)
      // 변경(2026-09-27): 변경 완료 안내를 토스트로 (이전: 폼 아래 초록 Alert)
      toast('이메일을 변경했어요.')
    } catch (err) {
      setEmailError(errorMessage(err, '이메일 변경에 실패했습니다.'))
    } finally {
      setEmailSaving(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError('')
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      toast('비밀번호를 변경했어요.')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err) {
      setPasswordError(errorMessage(err, '비밀번호 변경에 실패했습니다.'))
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleWithdrawSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWithdrawError('')
    if (!window.confirm('정말 탈퇴할까요? 되돌릴 수 없어요.')) return
    setWithdrawing(true)
    try {
      await withdraw(withdrawPassword)
      logout()
      toast('탈퇴했어요. 그동안 이용해 주셔서 감사합니다.')
      navigate('/', { replace: true })
    } catch (err) {
      setWithdrawError(errorMessage(err, '탈퇴에 실패했습니다.'))
      setWithdrawing(false)
    }
  }

  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-stone-100" />
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PageHeader back title="계정 설정" />

      <Alert tone="error">{loadError}</Alert>

      <form
        onSubmit={handleEmailSubmit}
        className="card flex flex-col gap-3 p-5 md:p-6"
        aria-labelledby="h-email"
      >
        <h2 id="h-email" className="h-section">
          이메일 변경
        </h2>
        <TextField
          label="새 이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          hint="이메일을 바꾸면 다시 로그인해야 할 수 있어요."
          required
        />
        <Alert tone="error">{emailError}</Alert>
        <Button type="submit" loading={emailSaving} className="w-full">
          이메일 변경
        </Button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="card flex flex-col gap-3 p-5 md:p-6"
        aria-labelledby="h-password"
      >
        <h2 id="h-password" className="h-section">
          비밀번호 변경
        </h2>
        <TextField
          label="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
        <TextField
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="새 비밀번호를 입력하세요"
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <TextField
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="한 번 더 입력하세요"
          minLength={8}
          value={newPasswordConfirm}
          onChange={(event) => setNewPasswordConfirm(event.target.value)}
          error={mismatch ? '비밀번호가 일치하지 않습니다.' : ''}
          required
        />
        <Alert tone="error">{passwordError}</Alert>
        <Button
          type="submit"
          loading={passwordSaving}
          disabled={mismatch}
          className="w-full"
        >
          비밀번호 변경
        </Button>
      </form>

      <form
        onSubmit={handleWithdrawSubmit}
        className="card flex flex-col gap-3 p-5 md:p-6"
        aria-labelledby="h-withdraw"
      >
        <h2 id="h-withdraw" className="h-section">
          회원 탈퇴
        </h2>
        <ul className="list-disc pl-5 text-[13px] text-stone-600">
          <li>로그인 정보와 알림·찜·대기 신청이 삭제되고, 같은 이메일로 다시 가입할 수 있어요.</li>
          <li>예약 이력이 없는 반려동물은 건강 기록과 함께 삭제돼요.</li>
          <li>예약·리뷰·채팅 기록은 병원 기록으로 남지만 내 이메일은 표시되지 않아요.</li>
          <li>다가오는 예약이 있거나 병원을 관리 중이면 탈퇴할 수 없어요.</li>
        </ul>
        <TextField
          label="비밀번호 확인"
          type="password"
          autoComplete="current-password"
          value={withdrawPassword}
          onChange={(event) => setWithdrawPassword(event.target.value)}
          hint="카카오로 가입했다면 비워두세요."
        />
        <Alert tone="error">{withdrawError}</Alert>
        <Button type="submit" variant="danger" loading={withdrawing} className="w-full">
          탈퇴하기
        </Button>
      </form>
    </div>
  )
}
