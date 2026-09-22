import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../../api/authApi'
import { getMe } from '../../api/userApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import { useAuth } from '../../hooks/useAuth'
import AuthShell from './AuthShell'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login: setAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await loginRequest({ email, password })
      setAuthenticated(data.data.accessToken, data.data.refreshToken)
      // 로그인 응답엔 role이 없어서 직접 조회 — ADMIN은 관리자 패널로,
      // 그 외에는 기존처럼 홈으로 보낸다. 조회 실패해도 로그인 자체는
      // 성공했으니 홈으로 보내고 useAuth가 알아서 role을 다시 채운다.
      try {
        const { data: me } = await getMe()
        navigate(me.data.role === 'ADMIN' ? '/admin' : '/', { replace: true })
      } catch {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="펫케어" description="우리 아이 건강을 함께 챙겨요">
      {location.state?.signupSuccess && (
        <Alert tone="ok">회원가입이 완료되었어요. 로그인해 주세요.</Alert>
      )}
      {location.state?.passwordResetSuccess && (
        <Alert tone="ok">비밀번호가 변경되었어요. 새 비밀번호로 로그인해 주세요.</Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <Alert tone="error">{error}</Alert>

        <Button type="submit" loading={loading} className="mt-2 w-full">
          로그인
        </Button>
      </form>

      <div className="flex items-center justify-between">
        <Link
          to="/forgot-password"
          className="flex min-h-11 items-center text-sm text-stone-600 hover:text-brand-600"
        >
          비밀번호를 잊으셨나요?
        </Link>
        <Link
          to="/signup"
          className="flex min-h-11 items-center text-sm font-bold text-brand-600"
        >
          회원가입
        </Link>
      </div>
    </AuthShell>
  )
}
