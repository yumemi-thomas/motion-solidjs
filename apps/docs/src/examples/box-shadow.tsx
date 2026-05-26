import { motion } from 'motion-solidjs'

export const meta = {
  slug: 'box-shadow',
  title: 'Box-shadow',
  category: 'animations',
  description: 'Soft, breathing drop-shadow on a hovering disc.',
  tag: 'shadow',
} as const

export default function BoxShadow() {
  return (
    <motion.div
      class="h-20 w-20 rounded-full bg-grad-violet"
      animate={{
        y: [0, -14, 0],
        boxShadow: [
          '0 8px 18px -10px rgba(124,92,255,0.4)',
          '0 36px 60px -10px rgba(124,92,255,0.6)',
          '0 8px 18px -10px rgba(124,92,255,0.4)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
