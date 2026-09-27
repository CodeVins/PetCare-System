import { motion, useReducedMotion } from 'motion/react'

// 밑줄형 탭 (시안의 반려동물 상세 / 대시보드). 활성 밑줄은 layoutId로 이어져
// 탭을 옮길 때 미끄러지듯 따라간다.
export default function Tabs({ tabs, value, onChange, layoutId = 'tab-underline', label }) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-4 mb-5 flex overflow-x-auto border-b border-stone-200 bg-white px-4 no-scrollbar md:mx-0 md:rounded-t-2xl md:px-2"
    >
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`relative h-12 flex-1 shrink-0 whitespace-nowrap px-4 text-[15px] transition-colors ${
              selected ? 'font-bold text-brand-600' : 'font-medium text-stone-600'
            }`}
          >
            {tab.label}
            {selected &&
              (reduceMotion ? (
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-600" />
              ) : (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-600"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              ))}
          </button>
        )
      })}
    </div>
  )
}
