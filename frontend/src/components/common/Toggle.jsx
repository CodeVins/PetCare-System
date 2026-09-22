// 52x32 스위치. checkbox 대신 role="switch" 버튼으로 두어 시안 모양을 그대로 쓴다.
export default function Toggle({ checked, onChange, disabled, labelledBy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-13 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-brand-600' : 'bg-stone-500'
      }`}
    >
      <span
        className={`absolute top-1 size-6 rounded-full bg-white transition-[left] duration-150 motion-reduce:transition-none ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}
