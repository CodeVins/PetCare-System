import { EnvelopeSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api/authApi'
import Alert from '../../components/common/Alert'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import AuthShell from './AuthShell'

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

  // 전송 완료 화면 (ForgotSent) — 큰 원형 아이콘 + 다음 행동 버튼
  if (submitted) {
    return (
      <div className="flex min-h-dvh justify-center bg-stone-50 px-6 pb-8 pt-12 md:items-center md:pt-8">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-5 text-center">
          <span className="flex size-22 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <EnvelopeSimple size={42} />
          </span>
          <h1 className="text-[32px] leading-tight">메일함을 확인해 주세요</h1>
          <p className="text-[15px] text-stone-600">
            이메일이 등록되어 있다면 재설정 링크를 보내드렸어요.
          </p>
          <Link to="/reset-password" className="btn-primary mt-3 w-full shadow">
            새 비밀번호 설정하기
          </Link>
          <Link
            to="/login"
            className="flex min-h-11 items-center text-sm text-stone-600 hover:text-brand-600"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthShell
      title="비밀번호 재설정"
      description="가입하신 이메일로 재설정 링크를 보내드려요"
    >
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

        <Alert tone="error">{error}</Alert>

        <Button type="submit" loading={loading} className="mt-2 w-full">
          재설정 링크 받기
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
