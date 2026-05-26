import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'height-auto',
  title: 'Height: auto',
  category: 'animations',
  description: 'A collapsible drawer with smooth height animation.',
  tag: 'auto-height',
} as const

export default function HeightAuto() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-64">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium"
      >
        {open ? 'Collapse' : 'Expand'} details
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="mt-2 overflow-hidden rounded-2xl border border-border bg-card text-xs text-fg-muted"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div className="space-y-2 px-4 py-3 leading-relaxed">
              <p>Motion measures the natural height and tweens to it.</p>
              <p>It also keeps overflow hidden during the animation.</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
