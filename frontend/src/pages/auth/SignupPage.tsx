import { useActionState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signup } from '../../api/authApi'
import { errorMessage } from '../../api/axiosInstance'
import Alert from '../../components/common/Alert'
import SubmitButton from '../../components/common/SubmitButton'
import TextField from '../../components/common/TextField'
import AuthShell, { type AuthLocationState } from './AuthShell'

interface SignupState {
  email: string
  error: string
}

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { from } = (location.state ?? {}) as AuthLocationState

  // 변경(2026-09-27): useActionState + <form action>으로 전환 (이전: useState + onSubmit)
  const [state, formAction] = useActionState<SignupState, FormData>(
    async (_prev, formData) => {
      const email = String(formData.get('email'))
      const password = String(formData.get('password'))
      try {
        await signup({ email, password })
        // 가입 전 보던 화면(from)을 로그인 화면까지 이어서 넘긴다
        navigate('/login', { replace: true, state: { signupSuccess: true, from } })
        return { email, error: '' }
      } catch (err) {
        return { email, error: errorMessage(err, '회원가입에 실패했습니다.') }
      }
    },
    { email: '', error: '' },
  )

  return (
    <AuthShell title="회원가입" description="이메일과 비밀번호만 있으면 시작할 수 있어요">
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
        <TextField
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상 입력하세요"
          minLength={8}
          required
        />

        <Alert tone="error">{state.error}</Alert>

        <SubmitButton className="mt-2 w-full">가입하기</SubmitButton>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-sm text-stone-600">
        이미 계정이 있나요?
        <Link
          to="/login"
          state={{ from }}
          className="flex min-h-11 items-center font-bold text-brand-600"
        >
          로그인
        </Link>
      </div>
    </AuthShell>
  )
}
