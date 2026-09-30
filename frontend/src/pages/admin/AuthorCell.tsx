import { Link } from 'react-router-dom'

// 리뷰/신고 관리 표의 사람 칸 — 이메일을 누르면 그 사람 기준으로 필터, 관리자는 사용자 상세로도 이동
export default function AuthorCell({
  email,
  userId,
  isAdmin,
  onFilter,
}: {
  email: string
  userId: number
  isAdmin: boolean
  onFilter: () => void
}) {
  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={onFilter}
        title="이 사용자만 보기"
        className="max-w-[200px] truncate text-left text-stone-800 hover:text-brand-700 hover:underline"
      >
        {email}
      </button>
      {isAdmin && (
        <Link to={`/admin/users/${userId}`} className="text-xs text-stone-400 hover:text-stone-700">
          사용자 상세
        </Link>
      )}
    </div>
  )
}
