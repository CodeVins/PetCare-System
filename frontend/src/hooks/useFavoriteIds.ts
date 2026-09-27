import { startTransition, useEffect, useOptimistic, useState } from 'react'
import { addFavorite, getFavorites, removeFavorite } from '../api/hospitalApi'
import { useAuth } from './useAuth'

// 병원 목록·상세가 같이 쓰는 즐겨찾기 상태. 비회원이면 조회하지 않고 빈 Set.
// 토글은 React 19 useOptimistic — 하트가 즉시 바뀌고, 요청이 실패하면 transition이
// 끝나면서 확정 상태(favoriteIds)로 자동 복귀한다 (수동 롤백 코드 불필요).
export function useFavoriteIds() {
  const { isAuthenticated } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set())
  const [optimisticIds, toggleOptimistic] = useOptimistic(
    favoriteIds,
    (current, hospitalId: number) => {
      const next = new Set(current)
      if (next.has(hospitalId)) next.delete(hospitalId)
      else next.add(hospitalId)
      return next
    },
  )

  useEffect(() => {
    if (!isAuthenticated) return
    getFavorites()
      .then(({ data }) => setFavoriteIds(new Set(data.data.content.map((h) => h.id))))
      .catch(() => {})
  }, [isAuthenticated])

  const toggleFavorite = (hospitalId: number) => {
    const wasFavorite = favoriteIds.has(hospitalId)
    startTransition(async () => {
      toggleOptimistic(hospitalId)
      try {
        if (wasFavorite) await removeFavorite(hospitalId)
        else await addFavorite(hospitalId)
        startTransition(() =>
          setFavoriteIds((prev) => {
            const next = new Set(prev)
            if (wasFavorite) next.delete(hospitalId)
            else next.add(hospitalId)
            return next
          }),
        )
      } catch {
        // 실패: 확정 상태를 안 바꿨으니 optimistic 값이 원래대로 돌아간다
      }
    })
  }

  return { favoriteIds: optimisticIds, toggleFavorite }
}
