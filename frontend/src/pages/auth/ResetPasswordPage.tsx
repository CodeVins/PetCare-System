import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../../api/authApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import AuthShell from './AuthShell'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [token, setToken] = useState(searchParams.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 확인 입력이 시작된 뒤에만 불일치를 표시한다 (타이핑 도중 붉게 뜨지 않도록)
  const mismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await confirmPasswordReset(token, newPassword)
      navigate('/login', { replace: true, state: { passwordResetSuccess: true } })
    } catch (err) {
      setError(err.response?.data?.message || '재설정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="새 비밀번호 설정" description="새로 사용할 비밀번호를 입력해 주세요">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="재설정 토큰"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          hint="이메일로 받은 링크의 토큰이 자동으로 채워집니다."
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

        <Alert tone="error">{error}</Alert>

        <Button
          type="submit"
          loading={loading}
          disabled={mismatch}
          className="mt-2 w-full"
        >
          비밀번호 변경
        </Button>
      </form>

      <Link
        to="/login"
        className="flex min-h-11 items-center justify-center text-sm text-stone-600 hover:text-brand-600"
      >
        로그인으로 돌아가기
      </Link>
    </AuthShell>
  )
}
