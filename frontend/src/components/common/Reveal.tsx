import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef, type ReactNode } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)
  // 변경(2026-10-27): amount 0.2 → 'some'(조금이라도 보이면) — 긴 목록은 컨테이너의 20%가 한 화면보다 커서 영영 안 보였음
  // (이전: 병원 목록을 [목록|지도] 2단으로 좁히자 카드 17개 목록 높이 3244px의 20% > 보이는 609px라 카드 전부 투명.
  // "더 보기"로 길어진 목록·낮은 화면에서도 같은 문제가 잠재)
  const inView = useInView(ref, { once: true, amount: 'some' })

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  // 변경(2026-10-26): whileInView 대신 useInView + animate — 한 번 보인 뒤 "더 보기"로 붙은 RevealItem이
  // opacity 0에 머물던 문제 (이전: whileInView 상태가 나중에 마운트된 자식에게 전달되지 않음)
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
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
