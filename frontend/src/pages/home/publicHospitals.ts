import { getHospitals } from '../../api/hospitalApi'
import type { Hospital } from '../../types/api'

// use()에 넘길 Promise는 렌더마다 새로 만들면 무한 서스펜드가 되므로 모듈에 한 번만 만들어 둔다.
// 실패하면 빈 배열로 — 랜딩의 숫자/추천 병원만 빠지고 나머지 화면은 그대로 보이게.
// ponytail: 세션 동안 캐시(새로고침 전까지 갱신 안 됨), 랜딩 요약용이라 충분 — 실시간이 필요하면 TTL 추가
let hospitalsPromise: Promise<Hospital[]> | null = null

export function loadPublicHospitals(): Promise<Hospital[]> {
  // 변경(2026-10-26): 랜딩은 상위 5곳만 쓰므로 size=5로 요청 (이전: 전체 병원을 받아 화면에서 자름)
  hospitalsPromise ??= getHospitals({ sort: 'RATING_DESC', size: 5 })
    .then(({ data }) => data.data.content)
    .catch(() => [])
  return hospitalsPromise
}
