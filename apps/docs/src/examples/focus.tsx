import { motion } from 'motion-solidjs'

export const meta = {
  slug: 'focus',
  title: 'Focus ring',
  category: 'gestures',
  description: 'whileFocus animates a glow ring on keyboard focus.',
  tag: 'whileFocus',
} as const

export default function Focus() {
  return (
    <motion.input
      placeholder="Tab into me"
      class="w-56 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-dim"
      whileFocus={{
        scale: 1.04,
        boxShadow: '0 0 0 4px rgba(255,77,141,0.25)',
        borderColor: '#ff4d8d',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    />
  )
}
