import { motion } from 'motion/react'

export const meta = {
  slug: 'tween',
  title: 'Tween easing',
  category: 'animations',
  description: 'A linear tween with custom cubic-bezier easing.',
  tag: 'tween',
} as const

export default function Tween() {
  return (
    <motion.div className="h-3 w-44 overflow-hidden rounded-full bg-card">
      <motion.div
        className="h-full rounded-full bg-grad-mint"
        animate={{ width: ['0%', '100%', '0%'] }}
        transition={{
          duration: 2.4,
          ease: [0.65, 0, 0.35, 1],
          repeat: Infinity,
        }}
      />
    </motion.div>
  )
}
