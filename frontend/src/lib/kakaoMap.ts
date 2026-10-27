// 카카오맵 JS SDK를 처음 쓸 때 한 번만 불러온다. 키가 없으면(로컬 .env.local 미설정 등) null → 지도 영역 숨김
// ponytail: SDK 타입은 any — 쓰는 API가 몇 개뿐이라 타입 패키지는 안 들임

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Kakao = any

declare global {
  interface Window {
    kakao?: Kakao
  }
}

const KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
let loading: Promise<Kakao> | null = null

export const hasKakaoKey = Boolean(KEY)

export function loadKakaoMaps(): Promise<Kakao> {
  if (!KEY) return Promise.reject(new Error('카카오 지도 키가 설정되지 않았습니다.'))
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`
    script.onload = () => window.kakao!.maps.load(() => resolve(window.kakao))
    script.onerror = () => {
      loading = null // 다음 화면 진입 때 다시 시도
      reject(new Error('지도를 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })
  return loading
}

// 카카오맵 길찾기 링크 (목적지만 지정 — 출발지는 카카오맵이 현재 위치로 잡음)
export function kakaoDirectionsUrl(name: string, lat: number, lng: number) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`
}
