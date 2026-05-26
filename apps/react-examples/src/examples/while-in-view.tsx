import { motion } from 'motion/react'
import { useRef } from 'react'

export const meta = {
  slug: 'while-in-view',
  title: 'While in view',
  category: 'scroll',
  description: 'Each card animates as it enters the viewport.',
  tag: 'whileInView',
} as const

export default function WhileInView() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  return (
    <div
      ref={containerRef}
      className="h-64 w-56 overflow-y-scroll rounded-2xl border border-border bg-card p-4"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.div
          key={i}
          className="mb-3 grid h-16 place-items-center rounded-2xl bg-grad-amber text-xs font-semibold text-white"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ root: containerRef, amount: 0.5 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        >
          Card {i + 1}
        </motion.div>
      ))}
    </div>
  )
}
