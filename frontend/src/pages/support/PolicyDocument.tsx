import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'

export interface PolicySection {
  title: string
  body: ReactNode
}

interface PolicyDocumentProps {
  title: string
  effectiveDate: string
  intro: ReactNode
  sections: PolicySection[]
}

// 이용약관·개인정보처리방침 공용 틀 — 목차 + 조항 본문
export default function PolicyDocument({ title, effectiveDate, intro, sections }: PolicyDocumentProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <title>{`${title} | 펫케어`}</title>
      <PageHeader title={title} subtitle={`시행일 ${effectiveDate}`} />

      <div className="card px-5 py-6 text-[15px] leading-relaxed text-stone-800 md:px-8 md:py-8">
        <div className="text-stone-700">{intro}</div>

        <nav aria-label="목차" className="my-6 rounded-lg bg-stone-50 px-4 py-3 text-sm">
          <ol className="grid gap-1 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.title}>
                <a href={`#policy-${index}`} className="text-stone-600 hover:text-brand-600 hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-7">
          {sections.map((section, index) => (
            <section key={section.title} id={`policy-${index}`} className="scroll-mt-24">
              <h2 className="mb-2 text-base font-bold md:text-[17px]">{section.title}</h2>
              <div className="flex flex-col gap-2 text-stone-700 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-stone-500">
        <Link to="/terms" className="hover:underline">
          이용약관
        </Link>
        <span className="mx-2">|</span>
        <Link to="/privacy" className="hover:underline">
          개인정보처리방침
        </Link>
      </p>
    </div>
  )
}
