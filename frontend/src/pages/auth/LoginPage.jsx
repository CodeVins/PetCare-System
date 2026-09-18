import { PawPrint } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../../api/authApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import { useAuth } from '../../hooks/useAuth'

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
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
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
          <h1 className="text-xl font-semibold text-stone-900">펫케어 로그인</h1>
          <p className="text-sm text-stone-500">
            반려동물 건강 기록을 관리해보세요.
          </p>
        </div>

        {location.state?.signupSuccess && (
          <p className="mb-4 rounded-lg bg-brand-50 px-3.5 py-2.5 text-center text-sm text-brand-700">
            회원가입이 완료되었습니다. 로그인해주세요.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <TextField
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            로그인
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          아직 계정이 없으신가요?{' '}
          <Link
            to="/signup"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
