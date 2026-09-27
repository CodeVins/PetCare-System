import { useId, type ComponentProps, type ReactNode } from 'react'

interface FieldExtras {
  label?: ReactNode
  error?: string
  hint?: ReactNode
}

// as로 input/textarea를 고르는 판별 유니언 — as="textarea"면 textarea 속성만 받는다
type TextFieldProps =
  | (FieldExtras & { as?: 'input' } & ComponentProps<'input'>)
  | (FieldExtras & { as: 'textarea' } & ComponentProps<'textarea'>)

export default function TextField(allProps: TextFieldProps) {
  const autoId = useId()
  const { label, error, hint, className = '' } = allProps
  const id = allProps.id ?? autoId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const fieldProps = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : hint ? hintId : undefined,
    className: `input ${error ? 'input-error' : ''} ${className}`,
  }

  let field
  if (allProps.as === 'textarea') {
    const { as: _as, label: _l, error: _e, hint: _h, className: _c, ...rest } = allProps
    field = <textarea {...rest} {...fieldProps} />
  } else {
    const { as: _as, label: _l, error: _e, hint: _h, className: _c, ...rest } = allProps
    field = <input {...rest} {...fieldProps} />
  }

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      {field}
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
