import { motion } from 'motion-solidjs'

export const meta = {
  slug: 'filter',
  title: 'Filter — blur & hue',
  category: 'animations',
  description: 'CSS filter strings interpolate between blur and hue-rotate.',
  tag: 'filter',
} as const

export default function Filter() {
  return (
    <motion.div
      class="h-24 w-24 rounded-full bg-grad-pink"
      animate={{
        filter: [
          'blur(0px) hue-rotate(0deg)',
          'blur(8px) hue-rotate(180deg)',
          'blur(0px) hue-rotate(360deg)',
        ],
      }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
