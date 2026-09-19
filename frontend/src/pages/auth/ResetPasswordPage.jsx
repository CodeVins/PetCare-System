import { PawPrint } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../../api/authApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [token, setToken] = useState(searchParams.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <div className="flex min-h-dvh items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50">
            <PawPrint weight="fill" size={26} className="text-brand-600" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">새 비밀번호 설정</h1>
          <p className="text-sm text-stone-500">
            이메일로 받은 재설정 토큰을 입력해주세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <TextField
            label="재설정 토큰"
            value={token}
            onChange={(event) => setToken(event.target.value)}
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            비밀번호 변경
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
