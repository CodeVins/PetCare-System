import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <Header />
      {/* 데스크톱 본문 1120px 중앙 정렬 */}
      {/* 변경(2026-09-27): 하단 탭바(76px) 여백을 main에서 Footer로 옮김 — 본문 아래에 푸터가 붙으면서
          탭바에 가려지는 건 푸터 쪽이 됨 (이전: main에 pb-[calc(76px+...)]) */}
      <main
        id="main-content"
        className="mx-auto min-h-[60dvh] w-full max-w-[1120px] px-4 pb-12 pt-6 md:px-6 md:pb-16 md:pt-10 lg:px-0"
      >
        {/* 변경(2026-09-27): 라우트 lazy 로딩 중 헤더/탭바가 사라지지 않게 본문만 Suspense (이전: Outlet 그대로) */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
