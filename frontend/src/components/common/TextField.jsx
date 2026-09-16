export default function TextField({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </span>
      <input
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          error
            ? 'border-red-400 bg-red-50 focus:border-red-400'
            : 'border-stone-200 bg-stone-50 focus:border-brand-500'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}
