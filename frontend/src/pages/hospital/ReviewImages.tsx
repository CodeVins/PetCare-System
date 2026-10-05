import { X } from '@phosphor-icons/react'
import { BASE_URL } from '../../api/axiosInstance'

interface ReviewImagesProps {
  imageUrls: string[]
  // 작성자 본인 화면에서만 — 썸네일마다 삭제 버튼
  onDelete?: (imageUrl: string) => void
}

// 리뷰 사진 썸네일 줄 — 누르면 원본을 새 탭으로. 병원 리뷰 목록·내 리뷰·관리 화면 공용
export default function ReviewImages({ imageUrls, onDelete }: ReviewImagesProps) {
  if (imageUrls.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2" aria-label="리뷰 사진">
      {imageUrls.map((url, index) => (
        <li key={url} className="relative">
          <a
            href={`${BASE_URL}${url}`}
            target="_blank"
            rel="noreferrer"
            className="block size-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
          >
            <img
              src={`${BASE_URL}${url}`}
              alt={`리뷰 사진 ${index + 1}`}
              loading="lazy"
              className="size-full object-cover"
            />
          </a>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(url)}
              aria-label={`리뷰 사진 ${index + 1} 삭제`}
              className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-stone-900 text-white shadow"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
