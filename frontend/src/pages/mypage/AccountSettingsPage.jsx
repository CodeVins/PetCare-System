import { useEffect, useState } from 'react'
import { changePassword, getMe, updateEmail } from '../../api/userApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import TextField from '../../components/common/TextField'

export default function AccountSettingsPage() {
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

  useEffect(() => {
    getMe()
      .then(({ data }) => setEmail(data.data.email))
      .catch((err) =>
        setLoadError(err.response?.data?.message || '내 정보를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const mismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm

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
          onChange={(event) => {
            setEmail(event.target.value)
            setEmailSuccess(false)
          }}
          hint="이메일을 바꾸면 다시 로그인해야 할 수 있어요."
          required
        />
        <Alert tone="error">{emailError}</Alert>
        {emailSuccess && <Alert tone="ok">이메일이 변경되었습니다.</Alert>}
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
        {passwordSuccess && <Alert tone="ok">비밀번호가 변경되었습니다.</Alert>}
        <Button
          type="submit"
          loading={passwordSaving}
          disabled={mismatch}
          className="w-full"
        >
          비밀번호 변경
        </Button>
      </form>
    </div>
  )
}
