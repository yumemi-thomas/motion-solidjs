import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'multi-state-badge',
  title: 'Multi-state badge',
  category: 'showcase',
  description: 'Cycle the badge between statuses with a layout crossfade.',
  tag: 'pill',
} as const

const states = [
  { id: 'queued', label: 'Queued', dot: '#7c5cff' },
  { id: 'running', label: 'Running', dot: '#ffd166' },
  { id: 'passed', label: 'Passed', dot: '#36e0c5' },
  { id: 'failed', label: 'Failed', dot: '#ff4d8d' },
] as const

export default function MultiStateBadge() {
  const [idx, setIdx] = useState(0)
  const next = () => setIdx((i) => (i + 1) % states.length)
  const cur = states[idx]

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        layout
        onClick={next}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <motion.span layout className="h-2 w-2 rounded-full" style={{ background: cur.dot }} />
        <AnimatePresence mode="wait">
          <motion.span
            key={cur.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {cur.label}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <div className="flex gap-1">
        {states.map((_, i) => (
          <span
            key={i}
            className="h-1 w-3 rounded-full transition-colors"
            style={{
              background: i === idx ? '#f3f3f7' : '#3a3a4f',
            }}
          />
        ))}
      </div>
    </div>
  )
}
