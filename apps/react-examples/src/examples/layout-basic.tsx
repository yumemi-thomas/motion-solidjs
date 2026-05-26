import { motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'layout-basic',
  title: 'Layout — basic',
  category: 'layout',
  description: 'Toggle the alignment; layout="true" tweens the position.',
  tag: 'layout',
} as const

export default function LayoutBasic() {
  const [right, setRight] = useState(false)

  return (
    <button
      onClick={() => setRight((v) => !v)}
      className="flex h-12 w-56 items-center rounded-full border border-border bg-card p-1.5"
      data-on={right}
      style={{ justifyContent: right ? 'flex-end' : 'flex-start' }}
    >
      <motion.span
        layout
        className="h-9 w-9 rounded-full bg-grad-rose shadow-glow"
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      />
    </button>
  )
}
