import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { errorMessage, type ApiPromise } from '../api/axiosInstance'
import type { PageResponse } from '../types/api'

interface PagedList<T> {
  items: T[]
  setItems: Dispatch<SetStateAction<T[]>>
  loading: boolean
  error: string
  setError: Dispatch<SetStateAction<string>>
  hasMore: boolean
  loadMore: () => void
  loadingMore: boolean
}

// PageResponse 목록 공용 훅 — 첫 페이지 로드 + "더 보기"로 다음 페이지를 이어 붙인다.
// fetchPage(page) 는 PageResponse<T>를 돌려주는 api 함수. T는 여기서 추론된다.
// key가 바뀌면(필터 값 등) 0페이지부터 다시 받는다. fetchPage는 매 렌더 새로 만들어져도 되게 deps에서 뺌.
// ponytail: offset 페이지라 목록에서 항목을 빼면(예약 확정 등) 다음 페이지에서 그만큼
// 건너뛸 수 있음 — 중복만 id로 걸러냄. 문제 되면 커서 기반 API로.
export function usePagedList<T extends { id: number }>(
  fetchPage: (page: number) => ApiPromise<PageResponse<T>>,
  key: unknown,
  fallbackMessage = '목록을 불러오지 못했습니다.',
): PagedList<T> {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    fetchPage(0)
      .then(({ data }) => {
        if (ignore) return
        setItems(data.data.content)
        setPage(0)
        setTotalPages(data.data.totalPages)
      })
      .catch((err: unknown) => {
        if (!ignore) setError(errorMessage(err, fallbackMessage))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loadMore = () => {
    setLoadingMore(true)
    fetchPage(page + 1)
      .then(({ data }) => {
        setItems((prev) => {
          const seen = new Set(prev.map((item) => item.id))
          return [...prev, ...data.data.content.filter((item) => !seen.has(item.id))]
        })
        setPage(page + 1)
        setTotalPages(data.data.totalPages)
      })
      .catch((err: unknown) => setError(errorMessage(err, fallbackMessage)))
      .finally(() => setLoadingMore(false))
  }

  return {
    items,
    setItems,
    loading,
    error,
    setError,
    hasMore: page + 1 < totalPages,
    loadMore,
    loadingMore,
  }
}
