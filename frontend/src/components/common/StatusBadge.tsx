// DESIGN_SPEC 상태 표시 패턴 — 예약 상태와 자가문진 위험도가 같은 뱃지 형태를
// 재사용한다. 라벨/색 매핑을 여기 한 곳에만 두고 각 화면은 코드만 넘긴다.
const STATUS = {
  PENDING: ['대기중', 'badge-wait'],
  CONFIRMED: ['확정', 'badge-ok'],
  REJECTED: ['거절됨', 'badge-danger'],
  CANCELLED: ['취소됨', 'badge-neutral'],
  NO_SHOW: ['노쇼', 'badge-danger'],
  // 자가문진 위험도
  LOW: ['낮음', 'badge-ok'],
  MEDIUM: ['주의', 'badge-wait'],
  HIGH: ['높음', 'badge-danger'],
}

export const statusLabel = (code) => STATUS[code]?.[0] ?? code

export default function StatusBadge({ status, label, className = '' }) {
  const [defaultLabel, tone] = STATUS[status] ?? [status, 'badge-neutral']
  return (
    <span className={`badge ${tone} ${className}`}>{label ?? defaultLabel}</span>
  )
}
