import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import { FAQ_CATEGORIES, FAQS, type FaqCategory } from '../../content/faq'

export default function FaqPage() {
  const [category, setCategory] = useState<FaqCategory | '전체'>('전체')
  const items = category === '전체' ? FAQS : FAQS.filter((faq) => faq.category === category)

  return (
    <div className="mx-auto max-w-3xl">
      <title>자주 묻는 질문 | 펫케어</title>
      <PageHeader title="자주 묻는 질문" />

      <div
        role="tablist"
        aria-label="질문 분류"
        className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0"
      >
        {(['전체', ...FAQ_CATEGORIES] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={category === value}
            onClick={() => setCategory(value)}
            className={`chip ${category === value ? 'chip-on' : ''}`}
          >
            {value}
          </button>
        ))}
      </div>

      {/* 네이티브 details/summary — 키보드·스크린리더 지원을 따로 구현할 필요가 없다 */}
      <div className="card divide-y divide-stone-100 overflow-hidden">
        {items.map((faq) => (
          <details key={faq.question} className="group">
            <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-stone-50 md:px-6 [&::-webkit-details-marker]:hidden">
              <span className="font-bold text-brand-600">Q</span>
              <span className="flex-1 font-medium">{faq.question}</span>
              <CaretDown
                size={18}
                className="mt-0.5 shrink-0 text-stone-500 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="flex gap-3 bg-stone-50 px-4 py-4 text-[15px] leading-relaxed text-stone-700 md:px-6">
              <span className="font-bold text-stone-500">A</span>
              <p className="flex-1">{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>

      <p className="mt-5 text-center text-sm text-stone-600">
        원하는 답이 없으면 병원 상세 화면의 [병원에 문의하기]로 병원에 직접 물어볼 수 있습니다.
      </p>
    </div>
  )
}
