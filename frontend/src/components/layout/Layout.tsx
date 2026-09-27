import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <Header />
      {/* 데스크톱 본문 1120px 중앙 정렬 / 모바일은 하단 탭바(76px)만큼 여백 확보 */}
      <main
        id="main-content"
        className="mx-auto w-full max-w-[1120px] px-4 pb-[calc(76px+env(safe-area-inset-bottom)+16px)] pt-6 md:px-6 md:pb-10 md:pt-10 lg:px-0"
      >
        <Outlet />
      </main>
    </div>
  )
}
