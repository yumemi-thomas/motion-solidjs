import { motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'segmented-control',
  title: 'Segmented control',
  category: 'showcase',
  description: 'Pill indicator slides between items with a shared layoutId.',
  tag: 'layoutId',
} as const

const items = ['Day', 'Week', 'Month', 'Year']

export default function SegmentedControl() {
  const [active, setActive] = useState('Week')

  return (
    <div className="flex gap-1 rounded-full border border-border bg-card p-1">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => setActive(it)}
          className="relative px-4 py-1.5 text-xs font-medium"
        >
          {active === it ? (
            <motion.span
              layoutId="seg"
              className="absolute inset-0 rounded-full bg-grad-violet"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          ) : null}
          <span
            className="relative"
            style={{ color: active === it ? '#fff' : 'var(--color-fg-muted)' }}
          >
            {it}
          </span>
        </button>
      ))}
    </div>
  )
}
