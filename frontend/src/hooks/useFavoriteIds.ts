import { startTransition, useEffect, useOptimistic, useState } from 'react'
import { addFavorite, getFavorites, removeFavorite } from '../api/hospitalApi'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

// 병원 목록·상세가 같이 쓰는 즐겨찾기 상태. 비회원이면 조회하지 않고 빈 Set.
// 토글은 React 19 useOptimistic — 하트가 즉시 바뀌고, 요청이 실패하면 transition이
// 끝나면서 확정 상태(favoriteIds)로 자동 복귀한다 (수동 롤백 코드 불필요).
export function useFavoriteIds() {
  const { isAuthenticated } = useAuth()
  const toast = useToast()
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
        toast(wasFavorite ? '즐겨찾기에서 뺐어요.' : '즐겨찾기에 추가했어요.')
      } catch {
        // 실패: 확정 상태를 안 바꿨으니 optimistic 값이 원래대로 돌아간다
        // 변경(2026-09-27): 실패 안내 토스트 추가 (이전: 하트만 조용히 되돌아가 실패한 걸 알기 어려웠음)
        toast('즐겨찾기를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.', 'error')
      }
    })
  }

  return { favoriteIds: optimisticIds, toggleFavorite }
}
