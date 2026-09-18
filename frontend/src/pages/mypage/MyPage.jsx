import { Heart } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout as logoutRequest } from '../../api/authApi'
import { changePassword, getMe, updateEmail } from '../../api/userApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import { useAuth } from '../../hooks/useAuth'

export default function MyPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [email, setEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getMe()
      .then(({ data }) => setEmail(data.data.email))
      .catch((err) =>
        setLoadError(err.response?.data?.message || '내 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setEmailError('')
    setEmailSuccess(false)
    setEmailSaving(true)
    try {
      await updateEmail(email)
      setEmailSuccess(true)
    } catch (err) {
      setEmailError(err.response?.data?.message || '이메일 변경에 실패했습니다.')
    } finally {
      setEmailSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutRequest()
    } catch {
      // refreshToken may already be invalid; clear local session regardless
    }
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-stone-100" />
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold text-stone-900">마이페이지</h1>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      <Link
        to="/favorites"
        className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-brand-200"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
          <Heart weight="fill" size={18} className="text-brand-600" />
        </span>
        <span className="text-sm font-medium text-stone-900">즐겨찾기한 병원 보기</span>
      </Link>

      <form
        onSubmit={handleEmailSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-700">이메일</h2>
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setEmailSuccess(false)
          }}
          required
        />
        {emailError && <p className="text-sm text-red-600">{emailError}</p>}
        {emailSuccess && (
          <p className="text-sm text-brand-700">이메일이 변경되었습니다.</p>
        )}
        <Button type="submit" loading={emailSaving} className="w-full">
          이메일 변경
        </Button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-700">비밀번호 변경</h2>
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
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <TextField
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={newPasswordConfirm}
          onChange={(event) => setNewPasswordConfirm(event.target.value)}
          required
        />
        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
        {passwordSuccess && (
          <p className="text-sm text-brand-700">비밀번호가 변경되었습니다.</p>
        )}
        <Button type="submit" loading={passwordSaving} className="w-full">
          비밀번호 변경
        </Button>
      </form>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-full border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100"
      >
        로그아웃
      </button>
    </div>
  )
}
