import { PawPrint } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/authApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup({ email, password })
      navigate('/login', { replace: true, state: { signupSuccess: true } })
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.')
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
          <h1 className="text-xl font-semibold text-stone-900">펫케어 회원가입</h1>
          <p className="text-sm text-stone-500">
            이메일과 비밀번호로 간편하게 시작하세요.
          </p>
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            회원가입
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          이미 계정이 있으신가요?{' '}
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
