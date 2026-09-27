import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}

// Fade+slide entrance for a single element or a list wrapper. Pass `stagger`
// to delay each direct motion child (see RevealItem) — used for card grids
// and lists so items cascade in instead of popping in all at once.
export function Reveal({ children, className = '', stagger = 0, delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
}

// One staggered entry - use as a direct child of <Reveal stagger=...>, or
// standalone (it still animates on its own viewport entry either way).
// 변경(2026-09-27): as를 'div' | 'li'로 한정 — TS 전환하면서 motion[as] 동적 조회를 타입이
// 잡히는 분기로 바꿈 (이전: 아무 태그 문자열이나 받아 motion[as] ?? motion.div)
export function RevealItem({
  children,
  className = '',
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  if (as === 'li') {
    return (
      <motion.li className={className} variants={ITEM_VARIANTS}>
        {children}
      </motion.li>
    )
  }
  return (
    <motion.div className={className} variants={ITEM_VARIANTS}>
      {children}
    </motion.div>
  )
}
