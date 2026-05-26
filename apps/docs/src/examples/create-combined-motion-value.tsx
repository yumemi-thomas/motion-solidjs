import {
  motion,
  createCombinedMotionValue,
  createMotionValue,
  createSpring,
  createTransform,
} from 'motion-solidjs'

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

  // Low-level: returns a MotionValue<[number, number]>. Sources must be
  // wired up by hand via the returned `subscribe([...])`.
  const { value: position, subscribe } = createCombinedMotionValue(
    () => [springX.get(), springY.get()] as const,
  )
  subscribe([springX, springY])

  // Now `position` is a normal MotionValue — feed it into a transform.
  const bg = createTransform(position, ([cx, cy]) => {
    const hue = (Math.atan2(cy, cx) * 180) / Math.PI + 180
    const sat = Math.min(100, Math.hypot(cx, cy))
    return `hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% 60%)`
  })

  return (
    <div class="relative grid h-56 w-56 place-items-center rounded-3xl border border-border bg-card">
      <motion.div
        drag
        dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x, y, backgroundColor: bg }}
        class="h-14 w-14 cursor-grab rounded-2xl shadow-glow active:cursor-grabbing"
      />
    </div>
  )
}
