import { motion } from 'motion-solidjs'

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
      class="grid h-24 w-24 place-items-center rounded-2xl text-2xl font-bold text-white"
      style={{ 'background-color': 'var(--bar)' }}
      animate={{ ['--bar']: ['#ff4d8d', '#36e0c5', '#ffd166', '#ff4d8d'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    >
      ✨
    </motion.div>
  )
}
