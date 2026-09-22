import { CaretDown } from '@phosphor-icons/react'
import { useId } from 'react'

// TextField와 같은 라벨/에러 규칙을 쓰는 select. 화살표는 네이티브를 숨기고
// 직접 그린다 (브라우저마다 기본 화살표 모양이 달라 입력창과 높이가 안 맞음).
export default function SelectField({
  label,
  error,
  hint,
  options = [],
  className = '',
  children,
  ...props
}) {
  const autoId = useId()
  const id = props.id ?? autoId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`input appearance-none pr-10 ${error ? 'input-error' : ''} ${className}`}
          {...props}
        >
          {children ??
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
        <CaretDown
          size={18}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <span id={errorId} role="alert" className="mt-1 block text-[13px] text-red-600">
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} className="mt-1 block text-[13px] text-stone-600">
            {hint}
          </span>
        )
      )}
    </div>
  )
}
