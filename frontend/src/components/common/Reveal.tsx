import { motion, useReducedMotion } from 'motion/react'

// Fade+slide entrance for a single element or a list wrapper. Pass `stagger`
// to delay each direct motion child (see RevealItem) — used for card grids
// and lists so items cascade in instead of popping in all at once.
export function Reveal({ children, className = '', stagger = 0, delay = 0 }) {
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

// One staggered entry - use as a direct child of <Reveal stagger=...>, or
// standalone (it still animates on its own viewport entry either way).
export function RevealItem({ children, className = '', as = 'div' }) {
  const reduceMotion = useReducedMotion()
  const Tag = motion[as] ?? motion.div

  if (reduceMotion) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </Tag>
  )
}
