import { useId } from 'react'

// 선택지가 2~4개면 select 대신 나란한 버튼으로 (시안의 종/크기 선택 방식).
// 실제 radiogroup 시맨틱을 써서 키보드/스크린리더에서도 라디오로 읽힌다.
export default function ChoiceGroup({ label, value, onChange, options, className = '' }) {
  const labelId = useId()

  return (
    <div className={className}>
      {label && (
        <span id={labelId} className="mb-1.5 block text-sm font-medium text-stone-700">
          {label}
        </span>
      )}
      <div role="radiogroup" aria-labelledby={label ? labelId : undefined} className="flex gap-2">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`h-12 flex-1 rounded-lg border px-2 text-[15px] transition-colors ${
                selected
                  ? 'border-[1.5px] border-brand-600 bg-brand-50 font-bold text-brand-600'
                  : 'border-stone-300 bg-white font-medium text-stone-800 hover:bg-stone-50'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
