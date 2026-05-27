// solidjs-motion has no `createCombinedMotionValue`. Combine sources by hand:
// derive a string MotionValue from both springs via their change events.
// (createTransform only maps a single numeric input through a range, so the
// two-source colour math can't go through it.)
import { motion, createMotionValue, createMotionValueEvent, createSpring } from 'solidjs-motion'

export const meta = {
  slug: 'create-combined-motion-value',
  title: 'createCombinedMotionValue',
  category: 'motion-values',
  description: 'Low-level: build a tuple motion value and explicitly subscribe its sources.',
  tag: 'low-level',
} as const

export default function UseCombinedMotionValueExample() {
  const x = createMotionValue(0)
  const y = createMotionValue(0)

  // Spring-smoothed sources for the visual.
  const springX = createSpring(x, { stiffness: 220, damping: 22 })
  const springY = createSpring(y, { stiffness: 220, damping: 22 })

  // A string MotionValue recomputed whenever either spring changes.
  const bg = createMotionValue('hsl(0 0% 60%)')
  const update = () => {
    const cx = springX.get()
    const cy = springY.get()
    const hue = (Math.atan2(cy, cx) * 180) / Math.PI + 180
    const sat = Math.min(100, Math.hypot(cx, cy))
    bg.set(`hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% 60%)`)
  }
  createMotionValueEvent(springX, 'change', update)
  createMotionValueEvent(springY, 'change', update)

  return (
    <div class="relative grid h-56 w-56 place-items-center rounded-3xl border border-border bg-card">
      <motion.div
        drag
        dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x, y, 'background-color': bg }}
        class="h-14 w-14 cursor-grab rounded-2xl shadow-glow active:cursor-grabbing"
      />
    </div>
  )
}
