import { Star } from '@phosphor-icons/react'

// 5점 만점 별점 표시(읽기전용). 리뷰 목록·리뷰 신고 관리에서 공유.
export default function Stars({ value, size = 16, className = '' }) {
  return (
    <span
      role="img"
      aria-label={`별점 5점 만점에 ${value}점`}
      className={`flex items-center gap-0.5 text-amber-700 ${className}`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} weight="fill" className={n <= value ? '' : 'text-stone-300'} />
      ))}
    </span>
  )
}
