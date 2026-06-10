import { motion, createMotionValue, createTransform } from 'motion-solidjs'

export const meta = {
  slug: 'create-motion-value',
  title: 'createMotionValue + createTransform',
  category: 'motion-values',
  description: 'Drag a slider — motion values feed both the dot and a live counter.',
  tag: 'MotionValue',
} as const

export default function UseMotionValueExample() {
  const x = createMotionValue(0)
  const bg = createTransform(x, [-100, 0, 100], ['#36e0c5', '#7c5cff', '#ff4d8d'])
  const scale = createTransform(x, [-100, 0, 100], [0.7, 1, 1.4])

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="relative flex h-16 w-64 items-center rounded-full border border-border bg-card px-2">
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.05}
          dragMomentum={false}
          class="h-12 w-12 cursor-grab rounded-full active:cursor-grabbing"
          style={{ x, 'background-color': bg, scale }}
        />
      </div>
      <motion.span class="font-mono text-xs" style={{ color: bg }}>
        drag me
      </motion.span>
    </div>
  )
}
