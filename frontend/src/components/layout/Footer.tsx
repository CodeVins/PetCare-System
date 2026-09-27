import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/notices', label: '공지사항' },
  { to: '/faq', label: '자주 묻는 질문' },
  { to: '/terms', label: '이용약관' },
  // 개인정보처리방침은 관례상 굵게 표시
  { to: '/privacy', label: '개인정보처리방침', strong: true },
]

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto max-w-[1120px] px-4 py-8 text-[13px] leading-relaxed text-stone-500 md:px-6 lg:px-0">
        <nav aria-label="서비스 정보" className="flex flex-wrap items-center gap-y-2 text-stone-700">
          {LINKS.map(({ to, label, strong }, index) => (
            <span key={to} className="flex items-center">
              {index > 0 && <span aria-hidden="true" className="mx-3 h-3 w-px bg-stone-300" />}
              <Link to={to} className={`hover:underline ${strong ? 'font-bold text-stone-900' : ''}`}>
                {label}
              </Link>
            </span>
          ))}
        </nav>

        <div className="mt-5 flex flex-col gap-0.5">
          <p className="font-bold text-stone-700">펫케어</p>
          <p>문의 help@petcare.example</p>
          <p>개인 포트폴리오 목적으로 운영하는 데모 서비스입니다. 등록된 병원은 실제 병원과 관련이 없습니다.</p>
          <p className="mt-3">© 2026 PetCare</p>
        </div>
      </div>
    </footer>
  )
}
