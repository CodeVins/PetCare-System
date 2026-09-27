import { useId } from 'react'

export default function TextField({
  label,
  error,
  hint,
  as = 'input',
  className = '',
  ...props
}) {
  const autoId = useId()
  const id = props.id ?? autoId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const Field = as === 'textarea' ? 'textarea' : 'input'

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <Field
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
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
