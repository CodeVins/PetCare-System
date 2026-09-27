import type { ComponentProps } from 'react'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
}

interface ButtonProps extends ComponentProps<'button'> {
  loading?: boolean
  variant?: keyof typeof VARIANTS
  size?: 'sm'
}

export default function Button({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  size,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${VARIANTS[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {loading ? '처리 중...' : children}
    </button>
  )
}
