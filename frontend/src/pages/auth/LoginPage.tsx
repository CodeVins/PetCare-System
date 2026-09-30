import { useActionState, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../../api/authApi'
import { errorMessage, LOGIN_NOTICE_KEY } from '../../api/axiosInstance'
import { getMe } from '../../api/userApi'
import Alert from '../../components/common/Alert'
import SubmitButton from '../../components/common/SubmitButton'
import TextField from '../../components/common/TextField'
import { useAuth } from '../../hooks/useAuth'
import AuthShell, { type AuthLocationState } from './AuthShell'

interface LoginState {
  email: string
  error: string
}

export default function LoginPage() {
  const { login: setAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state ?? {}) as AuthLocationState
  // 세션이 끊겨 튕겨 왔을 때 axiosInstance가 남긴 이유(정지 계정 등) — 한 번만 보여주고 지운다
  // (StrictMode에서 initializer가 두 번 불려도 같은 값이 나오게, 지우는 건 effect에서)
  const [sessionNotice] = useState(() => sessionStorage.getItem(LOGIN_NOTICE_KEY) ?? '')
  useEffect(() => {
    sessionStorage.removeItem(LOGIN_NOTICE_KEY)
  }, [])

  // 변경(2026-09-27): useState 4개 + onSubmit → React 19 useActionState + <form action>.
  // 제출 중 상태는 SubmitButton이 useFormStatus로 읽는다 (이전: loading/error/email/password 수동 관리)
  const [state, formAction] = useActionState<LoginState, FormData>(
    async (_prev, formData) => {
      const email = String(formData.get('email'))
      const password = String(formData.get('password'))
      try {
        const { data } = await loginRequest({ email, password })
        setAuthenticated(data.data.accessToken, data.data.refreshToken)
        // 로그인 응답엔 role이 없어서 직접 조회 — ADMIN은 관리자 패널로, 그 외엔
        // 로그인 전에 보던 화면(state.from, 없으면 홈)으로 돌려보낸다.
        let destination = locationState.from ?? '/'
        try {
          const { data: me } = await getMe()
          // 변경(2026-09-30): ADMIN은 보던 화면이 관리자 패널이 아니면 항상 /admin으로 — 관리자는 소비자 화면이
          // 아니라 패널에서 운영한다 (이전: state.from이 있으면 소비자 화면으로 돌아감)
          if (me.data.role === 'ADMIN' && !locationState.from?.startsWith('/admin')) destination = '/admin'
        } catch {
          // 조회 실패해도 로그인은 성공 — useAuth가 role을 다시 채운다
        }
        navigate(destination, { replace: true })
        return { email, error: '' }
      } catch (err) {
        return { email, error: errorMessage(err, '로그인에 실패했습니다.') }
      }
    },
    { email: '', error: '' },
  )

  return (
    <AuthShell title="펫케어" description="우리 아이 건강을 함께 챙겨요">
      {locationState.signupSuccess && (
        <Alert tone="ok">회원가입이 완료되었어요. 로그인해 주세요.</Alert>
      )}
      {locationState.passwordResetSuccess && (
        <Alert tone="ok">비밀번호가 변경되었어요. 새 비밀번호로 로그인해 주세요.</Alert>
      )}
      <Alert tone="error">{sessionNotice}</Alert>

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
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          required
        />

        <Alert tone="error">{state.error}</Alert>

        <SubmitButton className="mt-2 w-full">로그인</SubmitButton>
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
          state={{ from: locationState.from }}
          className="flex min-h-11 items-center text-sm font-bold text-brand-600"
        >
          회원가입
        </Link>
      </div>
    </AuthShell>
  )
}
