import { getMe } from '../../api/userApi'

// 로그인 성공 후 갈 곳 — ADMIN은 보던 화면이 관리자 패널이 아니면 /admin, 그 외엔 로그인 전에 보던 화면(없으면 홈).
// 로그인 응답엔 role이 없어서 직접 조회, 실패해도 로그인은 성공(useAuth가 role을 다시 채움)
export async function loginDestination(from?: string) {
  try {
    const { data: me } = await getMe()
    if (me.data.role === 'ADMIN' && !from?.startsWith('/admin')) return '/admin'
  } catch {
    // 무시
  }
  return from ?? '/'
}

const KAKAO_KEY = 'kakaoLogin'

// 카카오 인가 페이지로 이동 — state(CSRF 방지)와 돌아올 화면을 남겨두고 콜백에서 꺼낸다.
// 백엔드가 REST 키를 붙여 카카오로 302 보내므로 프론트는 키를 몰라도 됨
export function startKakaoLogin(from?: string) {
  const state = crypto.randomUUID()
  sessionStorage.setItem(KAKAO_KEY, JSON.stringify({ state, from }))
  window.location.assign(`/api/auth/kakao/login?state=${state}`)
}

// 한 번 꺼내면 지움(같은 state 재사용 방지)
export function takeKakaoLogin(): { state?: string; from?: string } {
  const saved = sessionStorage.getItem(KAKAO_KEY)
  sessionStorage.removeItem(KAKAO_KEY)
  try {
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}
