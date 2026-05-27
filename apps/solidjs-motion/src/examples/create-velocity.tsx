import { motion, createMotionValue, createTransform, createVelocity } from 'solidjs-motion'

export const meta = {
  slug: 'create-velocity',
  title: 'createVelocity',
  category: 'motion-values',
  description: 'Skew the dragged element by its instantaneous velocity.',
  tag: 'createVelocity',
} as const

export default function UseVelocityExample() {
  const x = createMotionValue(0)
  const velocity = createVelocity(x)
  const skew = createTransform(velocity, [-1500, 0, 1500], [-25, 0, 25])

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -120, right: 120 }}
      dragElastic={0.05}
      style={{ x, skewX: skew }}
      class="h-20 w-20 cursor-grab rounded-2xl bg-grad-violet shadow-glow active:cursor-grabbing"
    />
  )
}
