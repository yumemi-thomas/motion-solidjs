import { motion, Variants } from 'motion/react'

export const meta = {
  slug: 'variants-dynamic',
  title: 'Dynamic variants',
  category: 'variants',
  description: 'Variants can be functions that receive a per-item custom value.',
  tag: 'custom',
} as const

const bar: Variants = {
  hidden: { scaleY: 0.05, opacity: 0.3 },
  visible: (custom: number) => ({
    scaleY: custom,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 220,
      damping: 14,
      delay: custom * 0.15,
    },
  }),
}

export default function VariantsDynamic() {
  return (
    <motion.div className="flex h-32 items-end gap-2" initial="hidden" animate="visible">
      {[0.3, 0.8, 0.5, 1, 0.7, 0.4].map((h, i) => (
        <motion.div
          key={i}
          className="w-5 origin-bottom rounded-md bg-grad-rose"
          style={{ height: '100%' }}
          variants={bar}
          custom={h}
        />
      ))}
    </motion.div>
  )
}
