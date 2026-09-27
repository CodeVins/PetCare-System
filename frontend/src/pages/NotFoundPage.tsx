import { PawPrint } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-stone-50 px-6 pb-20 text-center">
      <span className="flex size-30 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <PawPrint size={60} />
      </span>
      <h1 className="mt-2 text-[32px] leading-tight">페이지를 찾을 수 없어요</h1>
      <p className="text-[15px] text-stone-600">주소가 바뀌었거나 없어진 페이지예요.</p>
      <Link to="/" className="btn-primary mt-3 px-8 shadow">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
