import { CaretRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

// 마이페이지 스타일 메뉴 목록: 카드 하나 안에 60px 행이 줄줄이.
export default function MenuList({ items, label }) {
  return (
    <nav aria-label={label} className="card overflow-hidden">
      {items.map(({ to, label: itemLabel, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex min-h-15 items-center gap-3.5 border-b border-stone-100 px-4 transition-colors last:border-0 hover:bg-stone-50"
        >
          <Icon size={22} className="shrink-0 text-brand-600" />
          <span className="flex-1">{itemLabel}</span>
          <CaretRight size={20} className="shrink-0 text-stone-600" />
        </Link>
      ))}
    </nav>
  )
}
