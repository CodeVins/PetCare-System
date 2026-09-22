import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/authApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import AuthShell from './AuthShell'

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
    <AuthShell title="회원가입" description="이메일과 비밀번호만 있으면 시작할 수 있어요">
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
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <Alert tone="error">{error}</Alert>

        <Button type="submit" loading={loading} className="mt-2 w-full">
          가입하기
        </Button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-sm text-stone-600">
        이미 계정이 있나요?
        <Link to="/login" className="flex min-h-11 items-center font-bold text-brand-600">
          로그인
        </Link>
      </div>
    </AuthShell>
  )
}
