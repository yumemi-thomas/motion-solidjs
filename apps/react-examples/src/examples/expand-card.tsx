import { motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'expand-card',
  title: 'Expandable card',
  category: 'layout',
  description: 'A card grows to reveal more content with shared layout.',
  tag: 'layout',
} as const

export default function ExpandCard() {
  const [open, setOpen] = useState(false)

  return (
    <motion.button
      layout
      onClick={() => setOpen((v) => !v)}
      className="flex flex-col items-start gap-2 overflow-hidden rounded-3xl border border-border bg-card p-5 text-left"
      style={{ width: open ? '18rem' : '12rem' }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
    >
      <motion.div layout className="h-12 w-12 rounded-2xl bg-grad-violet shadow-glow" />
      <motion.h3 layout className="text-sm font-semibold">
        Rocket boost
      </motion.h3>
      {open ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs leading-relaxed text-fg-muted"
        >
          A small payload of words appears once the layout completes. Click again to collapse —
          siblings move with springs.
        </motion.p>
      ) : null}
    </motion.button>
  )
}
