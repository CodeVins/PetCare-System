import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { kakaoLogin } from '../../api/authApi'
import { errorMessage } from '../../api/axiosInstance'
import Alert from '../../components/common/Alert'
import { useAuth } from '../../hooks/useAuth'
import AuthShell from './AuthShell'
import { loginDestination, takeKakaoLogin } from './loginFlow'

// 카카오 인가 후 돌아오는 화면(/oauth/kakao/callback?code=&state=) — 코드를 백엔드에 넘기고 우리 토큰을 받는다
export default function KakaoCallbackPage() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  // 인가 코드는 1회용 — StrictMode에서 effect가 두 번 돌아도 한 번만 요청
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const saved = takeKakaoLogin()
    const code = searchParams.get('code')
    if (searchParams.get('error')) {
      setError('카카오 로그인을 취소했어요.')
      return
    }
    if (!code || !saved.state || saved.state !== searchParams.get('state')) {
      setError('로그인 요청이 올바르지 않아요. 다시 시도해 주세요.')
      return
    }
    kakaoLogin(code)
      .then(async ({ data }) => {
        login(data.data.accessToken, data.data.refreshToken)
        navigate(await loginDestination(saved.from), { replace: true })
      })
      .catch((err) => setError(errorMessage(err, '카카오 로그인에 실패했습니다.')))
  }, [searchParams, login, navigate])

  return (
    <AuthShell title="카카오 로그인">
      {error ? (
        <>
          <Alert tone="error">{error}</Alert>
          <Link to="/login" replace className="btn btn-secondary w-full">
            로그인 화면으로
          </Link>
        </>
      ) : (
        <p className="text-center text-stone-600">로그인하는 중이에요…</p>
      )}
    </AuthShell>
  )
}
