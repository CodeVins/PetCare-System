import { PawPrint } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api/authApi'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || '요청에 실패했습니다.')
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
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">비밀번호 재설정</h1>
          <p className="text-sm text-stone-500">
            가입하신 이메일로 재설정 링크를 보내드려요.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-stone-700">
              이메일이 등록되어 있다면 재설정 링크를 보내드렸어요.
            </p>
            <Link
              to="/reset-password"
              className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              재설정 토큰을 이미 받으셨나요?
            </Link>
          </div>
        ) : (
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              재설정 링크 받기
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
