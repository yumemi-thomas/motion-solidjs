import { motion, useMotionValue, useTransform } from 'motion/react'

export const meta = {
  slug: 'use-motion-value',
  title: 'useMotionValue + useTransform',
  category: 'motion-values',
  description: 'Drag a slider — motion values feed both the dot and a live counter.',
  tag: 'MotionValue',
} as const

export default function UseMotionValueExample() {
  const x = useMotionValue(0)
  const bg = useTransform(x, [-100, 0, 100], ['#36e0c5', '#7c5cff', '#ff4d8d'])
  const scale = useTransform(x, [-100, 0, 100], [0.7, 1, 1.4])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-16 w-64 items-center rounded-full border border-border bg-card px-2">
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.05}
          dragMomentum={false}
          className="h-12 w-12 cursor-grab rounded-full active:cursor-grabbing"
          style={{ x, backgroundColor: bg, scale }}
        />
      </div>
      <motion.span className="font-mono text-xs" style={{ color: bg }}>
        drag me
      </motion.span>
    </div>
  )
}
