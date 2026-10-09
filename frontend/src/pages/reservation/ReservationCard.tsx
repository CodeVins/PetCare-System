import {
  ArrowsClockwise,
  ChatCircleDots,
  Clock,
  NotePencil,
  PawPrint,
  Star,
  Trash,
  XCircle,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BASE_URL } from '../../api/axiosInstance'
import StatusBadge from '../../components/common/StatusBadge'
import { calculateAge, formatTimeRange, RESERVATION_TYPE_LABEL, SPECIES_LABEL } from '../../lib/format'
import type { Reservation } from '../../types/api'

// 반려동물마다 같은 색이 나오게 petId로 고름(사진 없을 때 아바타 배경)
const AVATAR_ACCENTS = [
  'bg-brand-50 text-brand-600',
  'bg-amber-50 text-amber-600',
  'bg-sky-50 text-sky-600',
]

// 오늘·내일·D-n — 날짜(자정) 기준
function relativeDay(startTime: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(startTime)
  day.setHours(0, 0, 0, 0)
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  return `D-${diff}`
}

export function isUpcoming(reservation: Reservation): boolean {
  return (
    (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') &&
    new Date(reservation.startTime) > new Date()
  )
}

function ActionButton({
  onClick,
  to,
  icon,
  children,
  danger,
  disabled,
}: {
  onClick?: () => void
  to?: string
  icon: ReactNode
  children: ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  const className = `flex min-h-11 flex-1 items-center justify-center gap-1.5 px-2 text-sm font-bold transition-colors hover:bg-stone-50 disabled:opacity-50 ${
    danger ? 'text-red-700' : 'text-stone-700'
  }`
  if (to)
    return (
      <Link to={to} className={className}>
        {icon}
        {children}
      </Link>
    )
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {icon}
      {children}
    </button>
  )
}

export default function ReservationCard({
  reservation,
  busy,
  onReschedule,
  onCancel,
  onHide,
  onChat,
}: {
  reservation: Reservation
  busy: boolean
  onReschedule: () => void
  onCancel: () => void
  onHide: () => void
  onChat: () => void
}) {
  const start = new Date(reservation.startTime)
  const upcoming = isUpcoming(reservation)
  const visited = reservation.status === 'CONFIRMED' && !upcoming
  const age = calculateAge(reservation.petBirthDate)
  const petCaption = [
    reservation.petSpecies && SPECIES_LABEL[reservation.petSpecies],
    reservation.petBreed,
    age !== null && `${age}살`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className={`card flex h-full flex-col overflow-hidden ${upcoming ? '' : 'bg-stone-50/60'}`}>
      <div className="flex gap-4 p-4 md:p-5">
        {/* 날짜 블록 — 목록을 훑을 때 제일 먼저 보이는 정보 */}
        <div
          className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl py-2 ${
            upcoming ? 'bg-brand-50 text-brand-700' : 'bg-stone-100 text-stone-500'
          }`}
        >
          <span className="text-xs font-medium">{start.getMonth() + 1}월</span>
          <span className="font-display text-3xl leading-tight">{start.getDate()}</span>
          <span className="text-xs">{start.toLocaleDateString('ko-KR', { weekday: 'short' })}요일</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/hospitals/${reservation.hospitalId}`}
              className="min-w-0 truncate text-[17px] font-bold hover:text-brand-700"
            >
              {reservation.hospitalName}
            </Link>
            <StatusBadge status={reservation.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
            <span className="flex items-center gap-1">
              <Clock size={15} />
              {formatTimeRange(reservation.startTime, reservation.endTime)}
            </span>
            {upcoming && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                {relativeDay(reservation.startTime)}
              </span>
            )}
            {reservation.type && (
              <span className="badge badge-neutral h-6 px-2 text-xs">
                {RESERVATION_TYPE_LABEL[reservation.type] ?? reservation.type}
              </span>
            )}
          </p>

          {/* 어떤 아이 예약인지 — 사진과 이름을 크게 */}
          <div className="mt-3 flex items-center gap-2.5">
            <span
              className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                AVATAR_ACCENTS[reservation.petId % AVATAR_ACCENTS.length]
              }`}
            >
              {reservation.petImageUrl ? (
                <img
                  src={`${BASE_URL}${reservation.petImageUrl}`}
                  alt=""
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                  className="size-full object-cover"
                />
              ) : (
                <PawPrint size={22} weight="duotone" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold text-stone-900">
                {reservation.petName ?? '삭제된 반려동물'}
              </span>
              {petCaption && <span className="block truncate text-[13px] text-stone-500">{petCaption}</span>}
            </span>
          </div>

          {reservation.memo && (
            <p className="mt-3 line-clamp-2 rounded-lg bg-stone-100/80 px-3 py-2 text-[13px] text-stone-700">
              <NotePencil size={14} className="mr-1 inline align-[-2px] text-stone-500" />
              {reservation.memo}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex divide-x divide-stone-100 border-t border-stone-100">
        {upcoming && (
          <>
            <ActionButton onClick={onReschedule} icon={<ArrowsClockwise size={17} />} disabled={busy}>
              시간 변경
            </ActionButton>
            <ActionButton onClick={onChat} icon={<ChatCircleDots size={17} />}>
              문의
            </ActionButton>
            <ActionButton onClick={onCancel} icon={<XCircle size={17} />} danger disabled={busy}>
              예약 취소
            </ActionButton>
          </>
        )}
        {!upcoming && (
          <>
            {visited && (
              <ActionButton to={`/hospitals/${reservation.hospitalId}?tab=reviews`} icon={<Star size={17} />}>
                리뷰 쓰기
              </ActionButton>
            )}
            <ActionButton to={`/hospitals/${reservation.hospitalId}?tab=booking`} icon={<ArrowsClockwise size={17} />}>
              다시 예약
            </ActionButton>
            <ActionButton onClick={onHide} icon={<Trash size={17} />} danger disabled={busy}>
              삭제
            </ActionButton>
          </>
        )}
      </div>
    </article>
  )
}
