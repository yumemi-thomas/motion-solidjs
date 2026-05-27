import { motion } from 'solidjs-motion'

export const meta = {
  slug: 'hover',
  title: 'Hover',
  category: 'gestures',
  description: 'hover springs the box up and changes its background.',
  tag: 'hover',
} as const

export default function Hover() {
  return (
    <motion.div
      class="h-20 w-20 rounded-2xl bg-grad-violet shadow-glow"
      hover={{ y: -10, scale: 1.08, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
    />
  )
}
