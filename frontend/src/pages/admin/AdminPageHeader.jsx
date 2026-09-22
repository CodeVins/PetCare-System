// 소비자 앱 PageHeader(Jua 헤딩·둥근 뒤로가기 버튼)와 다르게, 관리자 패널은
// 평범한 굵은 산세리프 + 좌측 브레드크럼 스타일 back 링크를 쓴다.
export default function AdminPageHeader({ title, description, action, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
