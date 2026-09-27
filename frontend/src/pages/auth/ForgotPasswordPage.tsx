import { EnvelopeSimple } from '@phosphor-icons/react'
import { useActionState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api/authApi'
import { errorMessage } from '../../api/axiosInstance'
import Alert from '../../components/common/Alert'
import SubmitButton from '../../components/common/SubmitButton'
import TextField from '../../components/common/TextField'
import AuthShell from './AuthShell'

interface ForgotState {
  email: string
  error: string
  submitted: boolean
}

export default function ForgotPasswordPage() {
  // 변경(2026-09-27): useActionState + <form action>으로 전환 (이전: useState 4개 + onSubmit)
  const [state, formAction] = useActionState<ForgotState, FormData>(
    async (_prev, formData) => {
      const email = String(formData.get('email'))
      try {
        await requestPasswordReset(email)
        return { email, error: '', submitted: true }
      } catch (err) {
        return { email, error: errorMessage(err, '요청에 실패했습니다.'), submitted: false }
      }
    },
    { email: '', error: '', submitted: false },
  )

  // 전송 완료 화면 (ForgotSent) — 큰 원형 아이콘 + 다음 행동 버튼
  if (state.submitted) {
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
    <AuthShell title="비밀번호 재설정" description="가입하신 이메일로 재설정 링크를 보내드려요">
      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          label="이메일"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          defaultValue={state.email}
          required
        />

        <Alert tone="error">{state.error}</Alert>

        <SubmitButton className="mt-2 w-full">재설정 링크 받기</SubmitButton>
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
