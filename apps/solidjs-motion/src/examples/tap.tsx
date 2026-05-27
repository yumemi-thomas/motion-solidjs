import { motion } from 'solidjs-motion'

export const meta = {
  slug: 'tap',
  title: 'Tap',
  category: 'gestures',
  description: 'Press-and-hold shrinks the button, release springs it back.',
  tag: 'press',
} as const

export default function Tap() {
  return (
    <motion.button
      class="rounded-full bg-grad-rose px-7 py-3 text-sm font-semibold text-white shadow-glow"
      hover={{ scale: 1.05 }}
      press={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    >
      Press me
    </motion.button>
  )
}
