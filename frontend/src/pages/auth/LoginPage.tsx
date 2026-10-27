import { useActionState, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../../api/authApi'
import { errorMessage, LOGIN_NOTICE_KEY } from '../../api/axiosInstance'
import Alert from '../../components/common/Alert'
import SubmitButton from '../../components/common/SubmitButton'
import TextField from '../../components/common/TextField'
import { useAuth } from '../../hooks/useAuth'
import AuthShell, { type AuthLocationState } from './AuthShell'
import { loginDestination, startKakaoLogin } from './loginFlow'

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
        // 변경(2026-10-27): 로그인 후 이동 규칙(ADMIN → /admin, 그 외 보던 화면)을 loginFlow로 옮김 — 카카오 로그인 콜백과
        // 같이 쓰려고 (이전: 이 자리에서 getMe 조회 후 직접 계산, 동작은 같음)
        navigate(await loginDestination(locationState.from), { replace: true })
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

      {/* 카카오 로그인 — 처음이면 자동 가입, 카카오 인증 이메일이 같은 기존 계정이면 그 계정으로 연결.
          색·문구는 카카오 디자인 가이드(배경 #FEE500, 글자 85% 검정) */}
      <button
        type="button"
        onClick={() => startKakaoLogin(locationState.from)}
        className="btn w-full bg-[#FEE500] text-black/85 hover:bg-[#F5DC00]"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
          <path
            fill="currentColor"
            d="M12 3C6.48 3 2 6.5 2 10.82c0 2.8 1.88 5.25 4.7 6.63l-.96 3.5c-.08.3.26.55.52.38l4.17-2.76c.51.06 1.03.09 1.57.09 5.52 0 10-3.5 10-7.84S17.52 3 12 3z"
          />
        </svg>
        카카오 로그인
      </button>

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
