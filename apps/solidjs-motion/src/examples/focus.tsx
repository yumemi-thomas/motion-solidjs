import { motion } from 'solidjs-motion'

export const meta = {
  slug: 'focus',
  title: 'Focus ring',
  category: 'gestures',
  description: 'focus animates a glow ring on keyboard focus.',
  tag: 'focus',
} as const

export default function Focus() {
  return (
    <motion.input
      placeholder="Tab into me"
      class="w-56 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-dim"
      focus={{
        scale: 1.04,
        'box-shadow': '0 0 0 4px rgba(255,77,141,0.25)',
        'border-color': '#ff4d8d',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    />
  )
}
