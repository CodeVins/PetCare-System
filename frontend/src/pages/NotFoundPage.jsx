import { PawPrint } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-stone-50 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50">
        <PawPrint weight="fill" size={28} className="text-brand-600" />
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          주소가 바뀌었거나 존재하지 않는 페이지예요.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
