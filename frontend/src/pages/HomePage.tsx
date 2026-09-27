import {
  Buildings,
  CalendarCheck,
  CaretRight,
  ChatCircleDots,
  ClipboardText,
  Heart,
  MagnifyingGlass,
  PawPrint,
  Star,
  type Icon,
} from '@phosphor-icons/react'
import { Suspense, use } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FAQS } from '../content/faq'
import { NOTICE_TAG, NOTICES } from '../content/notices'
import { useAuth } from '../hooks/useAuth'
import type { Hospital } from '../types/api'
import { loadPublicHospitals } from './home/publicHospitals'

const QUICK_MENU: { to: string; label: string; icon: Icon }[] = [
  { to: '/hospitals', label: '병원 찾기', icon: Buildings },
  { to: '/reservations', label: '내 예약', icon: CalendarCheck },
  { to: '/pets', label: '반려동물', icon: PawPrint },
  { to: '/health-check', label: '자가문진', icon: ClipboardText },
  { to: '/favorites', label: '즐겨찾기', icon: Heart },
  { to: '/chats', label: '병원 문의', icon: ChatCircleDots },
]

const SEARCH_SHORTCUTS = [
  { to: '/hospitals?is24Hours=true', label: '24시간 병원' },
  { to: '/hospitals?hasParking=true', label: '주차 가능' },
  { to: '/hospitals?minRating=4', label: '평점 4.0 이상' },
]

function SectionTitle({ id, children, moreTo }: { id: string; children: string; moreTo?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 id={id} className="h-section">
        {children}
      </h2>
      {moreTo && (
        <Link
          to={moreTo}
          className="flex min-h-11 items-center gap-0.5 text-sm text-stone-600 hover:text-brand-600"
        >
          더보기
          <CaretRight size={14} />
        </Link>
      )}
    </div>
  )
}

// 공개 API 결과를 React 19 use()로 읽는다 — 로딩은 바깥 Suspense가 처리
function TopHospitalRows({ hospitalsPromise }: { hospitalsPromise: Promise<Hospital[]> }) {
  const hospitals = use(hospitalsPromise).slice(0, 5)

  if (hospitals.length === 0) {
    return <p className="py-8 text-center text-sm text-stone-500">등록된 병원이 없습니다.</p>
  }

  return (
    <ol className="divide-y divide-stone-100">
      {hospitals.map((hospital, index) => (
        <li key={hospital.id}>
          <Link
            to={`/hospitals/${hospital.id}`}
            className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-stone-50 md:gap-4 md:px-2"
          >
            <span className="w-5 shrink-0 text-center font-bold text-brand-600">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate font-bold">{hospital.name}</span>
                {hospital.is24Hours && (
                  <span className="shrink-0 rounded bg-brand-50 px-1.5 text-[11px] font-bold leading-5 text-brand-700">
                    24시
                  </span>
                )}
              </span>
              <span className="block truncate text-[13px] text-stone-500">
                {[hospital.specialty, hospital.address].filter(Boolean).join(' · ') || '정보 준비 중'}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star size={14} weight="fill" className="text-amber-500" />
              <b>{hospital.averageRating?.toFixed(1) ?? '-'}</b>
              <span className="text-stone-500">({hospital.reviewCount})</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

// 변경(2026-09-27): 회원/비회원 공용 홈 하나로 통일 — 로그인 전용 요약(접종·예약·내 반려동물)은
// 반려동물 화면으로 옮기고, 홈은 병원 검색 + 바로가기 + 이용 안내 + 공지/FAQ로 구성
// (이전: 비회원 GuestLanding / 회원 MemberHome 분기)
export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const hospitalsPromise = loadPublicHospitals()

  // React 19 form action — 검색어를 병원 목록 쿼리로 넘긴다
  const searchAction = (formData: FormData) => {
    const keyword = String(formData.get('keyword') ?? '').trim()
    navigate(keyword ? `/hospitals?keyword=${encodeURIComponent(keyword)}` : '/hospitals')
  }

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <title>펫케어 - 동물병원 예약과 반려동물 건강 기록</title>

      {/* 검색 배너 */}
      <section className="-mx-4 -mt-6 bg-brand-600 px-5 pb-8 pt-8 text-white md:mx-0 md:mt-0 md:rounded-2xl md:px-10 md:py-11">
        <p className="text-[15px] text-brand-100">동물병원 찾기부터 진료 예약, 건강 기록까지</p>
        <h1 className="mt-1.5 text-[28px] leading-snug md:text-[40px]">
          우리 아이 다니는 병원,
          <br />
          펫케어에서 찾고 예약하세요
        </h1>

        <form action={searchAction} role="search" className="mt-6 flex max-w-xl gap-2">
          <label htmlFor="home-search" className="sr-only">
            병원 이름 검색
          </label>
          <input
            id="home-search"
            name="keyword"
            type="search"
            placeholder="병원 이름을 입력하세요"
            className="input h-12 flex-1 border-0"
          />
          <button type="submit" className="btn shrink-0 bg-stone-900 px-5 text-white hover:bg-stone-800">
            <MagnifyingGlass size={18} weight="bold" />
            검색
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-100">
          <span>바로 찾기</span>
          {SEARCH_SHORTCUTS.map((shortcut) => (
            <Link key={shortcut.to} to={shortcut.to} className="underline-offset-2 hover:text-white hover:underline">
              #{shortcut.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 바로가기 */}
      <nav aria-label="바로가기" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {QUICK_MENU.map(({ to, label, icon: IconComponent }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 bg-white px-2 py-4 text-sm font-medium transition-colors hover:border-brand-600 hover:text-brand-700"
          >
            <IconComponent size={28} className="text-brand-600" />
            {label}
          </Link>
        ))}
      </nav>

      {/* 이용 안내 — 누가 무엇을 할 수 있는지 */}
      <section aria-labelledby="h-guide">
        <SectionTitle id="h-guide">펫케어 이용 안내</SectionTitle>
        <div className="card grid divide-y divide-stone-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex flex-col gap-2 p-5 md:p-6">
            <h3 className="font-bold">처음 오셨다면</h3>
            <ul className="flex-1 list-disc space-y-1 pl-4 text-[15px] text-stone-600">
              <li>로그인 없이 동물병원 검색</li>
              <li>병원 정보와 보호자 리뷰 확인</li>
              <li>예약 가능한 시간 미리 보기</li>
            </ul>
            <Link to="/hospitals" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
              병원 둘러보기 &gt;
            </Link>
          </div>
          <div className="flex flex-col gap-2 p-5 md:p-6">
            <h3 className="font-bold">보호자 회원</h3>
            <ul className="flex-1 list-disc space-y-1 pl-4 text-[15px] text-stone-600">
              <li>진료 예약, 마감된 시간 대기 신청</li>
              <li>체중·접종·진료 기록과 체중 그래프</li>
              <li>접종 예정일과 예약 전날 알림</li>
              <li>가족을 공동 보호자로 초대</li>
            </ul>
            {isAuthenticated ? (
              <Link to="/pets" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
                내 반려동물 보기 &gt;
              </Link>
            ) : (
              <Link to="/signup" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
                회원가입 하기 &gt;
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-2 p-5 md:p-6">
            <h3 className="font-bold">병원 관리자</h3>
            <ul className="flex-1 list-disc space-y-1 pl-4 text-[15px] text-stone-600">
              <li>예약 확정·거절, 노쇼 처리</li>
              <li>진료 가능 시간 한 번에 등록</li>
              <li>리뷰 답글, 보호자 문의 응대</li>
            </ul>
            <Link to="/faq" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
              병원 계정 안내 &gt;
            </Link>
          </div>
        </div>
      </section>

      {/* 평점 높은 병원 */}
      <section aria-labelledby="h-top" className="card p-5 md:p-6">
        <SectionTitle id="h-top" moreTo="/hospitals">
          평점 높은 병원
        </SectionTitle>
        <Suspense
          fallback={
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          }
        >
          <TopHospitalRows hospitalsPromise={hospitalsPromise} />
        </Suspense>
      </section>

      {/* 공지사항 / 자주 묻는 질문 */}
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="h-notice" className="card p-5 md:p-6">
          <SectionTitle id="h-notice" moreTo="/notices">
            공지사항
          </SectionTitle>
          <ul className="divide-y divide-stone-100">
            {NOTICES.slice(0, 4).map((notice) => (
              <li key={notice.id}>
                <Link
                  to={`/notices/${notice.id}`}
                  className="flex items-center gap-2 py-2.5 text-[15px] hover:text-brand-700"
                >
                  <span
                    className={`shrink-0 rounded px-1.5 text-[11px] font-bold leading-5 ${NOTICE_TAG[notice.category]}`}
                  >
                    {notice.category}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{notice.title}</span>
                  <time dateTime={notice.date} className="shrink-0 text-[13px] text-stone-500">
                    {notice.date.slice(5).replace('-', '.')}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="h-faq" className="card p-5 md:p-6">
          <SectionTitle id="h-faq" moreTo="/faq">
            자주 묻는 질문
          </SectionTitle>
          <ul className="divide-y divide-stone-100">
            {FAQS.slice(0, 4).map((faq) => (
              <li key={faq.question}>
                <Link to="/faq" className="flex gap-2 py-2.5 text-[15px] hover:text-brand-700">
                  <span className="font-bold text-brand-600">Q</span>
                  <span className="min-w-0 flex-1 truncate">{faq.question}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
