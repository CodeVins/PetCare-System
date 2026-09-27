import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import { NOTICE_TAG, NOTICES } from '../../content/notices'

export default function NoticeDetailPage() {
  const { noticeId } = useParams()
  const index = NOTICES.findIndex((n) => String(n.id) === noticeId)
  const notice = NOTICES[index]

  if (!notice) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader back title="공지사항" />
        <div className="card px-6 py-12 text-center text-stone-600">
          삭제되었거나 없는 공지입니다.
          <Link to="/notices" className="mt-3 block font-bold text-brand-600">
            목록으로
          </Link>
        </div>
      </div>
    )
  }

  // 목록이 최신순이라 index-1이 더 최근 글
  const newer = NOTICES[index - 1]
  const older = NOTICES[index + 1]

  return (
    <div className="mx-auto max-w-3xl">
      <title>{`${notice.title} | 펫케어 공지사항`}</title>
      <PageHeader back title="공지사항" />

      <article className="card overflow-hidden">
        <header className="border-b border-stone-100 px-5 py-5 md:px-8">
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${NOTICE_TAG[notice.category]}`}>
            {notice.category}
          </span>
          <h2 className="mt-2 text-lg font-bold leading-snug md:text-xl">{notice.title}</h2>
          <time dateTime={notice.date} className="mt-1 block text-[13px] text-stone-500">
            {notice.date.replaceAll('-', '.')}
          </time>
        </header>
        <div className="flex flex-col gap-4 px-5 py-6 leading-relaxed text-stone-800 md:px-8">
          {notice.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <nav aria-label="이전·다음 공지" className="card mt-3 divide-y divide-stone-100 text-sm">
        {newer && (
          <Link to={`/notices/${newer.id}`} className="flex gap-4 px-5 py-3.5 hover:bg-stone-50">
            <span className="w-10 shrink-0 text-stone-500">다음글</span>
            <span className="truncate">{newer.title}</span>
          </Link>
        )}
        {older && (
          <Link to={`/notices/${older.id}`} className="flex gap-4 px-5 py-3.5 hover:bg-stone-50">
            <span className="w-10 shrink-0 text-stone-500">이전글</span>
            <span className="truncate">{older.title}</span>
          </Link>
        )}
      </nav>

      <div className="mt-5 text-center">
        <Link to="/notices" className="btn btn-secondary btn-sm">
          목록
        </Link>
      </div>
    </div>
  )
}
