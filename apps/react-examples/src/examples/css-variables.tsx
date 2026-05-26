import { motion } from 'motion/react'

export const meta = {
  slug: 'css-variables',
  title: 'CSS variables',
  category: 'animations',
  description: 'Animate any custom property — color, length, anything.',
  tag: '--props',
} as const

export default function CssVariables() {
  return (
    <motion.div
      className="grid h-24 w-24 place-items-center rounded-2xl text-2xl font-bold text-white"
      style={{ backgroundColor: 'var(--bar)' }}
      animate={{ ['--bar' as string]: ['#ff4d8d', '#36e0c5', '#ffd166', '#ff4d8d'] } as never}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    >
      ✨
    </motion.div>
  )
}
