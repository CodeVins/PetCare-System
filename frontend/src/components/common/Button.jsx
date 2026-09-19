export default function Button({
  children,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform,box-shadow] duration-150 hover:bg-brand-700 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:active:scale-100 ${className}`}
      {...props}
    >
      {loading ? '처리 중...' : children}
    </button>
  )
}
