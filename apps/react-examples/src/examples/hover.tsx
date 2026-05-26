import { motion } from 'motion/react'

export const meta = {
  slug: 'hover',
  title: 'Hover',
  category: 'gestures',
  description: 'whileHover springs the box up and changes its background.',
  tag: 'whileHover',
} as const

export default function Hover() {
  return (
    <motion.div
      className="h-20 w-20 rounded-2xl bg-grad-violet shadow-glow"
      whileHover={{ y: -10, scale: 1.08, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
    />
  )
}
