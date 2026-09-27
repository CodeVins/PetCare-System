import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import { NOTICE_TAG, NOTICES } from '../../content/notices'

export default function NoticeListPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <title>공지사항 | 펫케어</title>
      <PageHeader title="공지사항" />

      <ul className="card divide-y divide-stone-100 overflow-hidden">
        {NOTICES.map((notice) => (
          <li key={notice.id}>
            <Link
              to={`/notices/${notice.id}`}
              className="flex flex-col gap-1 px-4 py-4 transition-colors hover:bg-stone-50 md:flex-row md:items-center md:gap-4 md:px-6"
            >
              <span
                className={`w-fit shrink-0 rounded px-2 py-0.5 text-xs font-bold ${NOTICE_TAG[notice.category]}`}
              >
                {notice.category}
              </span>
              <span className="min-w-0 flex-1 font-medium md:truncate">{notice.title}</span>
              <time dateTime={notice.date} className="shrink-0 text-[13px] text-stone-500">
                {notice.date.replaceAll('-', '.')}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
