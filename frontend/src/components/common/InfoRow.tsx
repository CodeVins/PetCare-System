// dl/dt/dd 한 줄짜리 정보 표시 행. 병원 상세·반려동물 개요처럼 "라벨: 값"이
// 여러 줄 이어지는 읽기전용 카드에서 공용으로 쓴다. 값이 없으면 그 줄 자체를 숨긴다.
export default function InfoRow({ term, children }) {
  if (children == null || children === '') return null
  return (
    <div className="flex gap-3 border-b border-stone-100 py-3.5 last:border-0">
      <dt className="w-21 shrink-0 text-sm text-stone-600">{term}</dt>
      <dd className="m-0 text-[15px]">{children}</dd>
    </div>
  )
}
