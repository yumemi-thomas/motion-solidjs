import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useRef } from 'react'

export const meta = {
  slug: 'use-spring',
  title: 'useSpring',
  category: 'motion-values',
  description: 'Smooth any motion value with a spring — fingers track lag.',
  tag: 'useSpring',
} as const

export default function UseSpringExample() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 22 })
  const springY = useSpring(y, { stiffness: 200, damping: 22 })

  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x.set(e.clientX - rect.left - rect.width / 2)
      y.set(e.clientY - rect.top - rect.height / 2)
    }
    el.addEventListener('pointermove', handle)
    return () => el.removeEventListener('pointermove', handle)
  }, [x, y])

  return (
    <div
      ref={boxRef}
      className="relative grid h-56 w-56 place-items-center rounded-3xl border border-border bg-card text-xs text-fg-dim"
    >
      <span>move pointer</span>
      <motion.span
        className="pointer-events-none absolute h-12 w-12 rounded-full bg-grad-rose shadow-glow"
        style={{ x: springX, y: springY }}
      />
    </div>
  )
}
