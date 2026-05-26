import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'

export const meta = {
  slug: 'cursor-trail',
  title: 'Cursor trail',
  category: 'showcase',
  description: 'A chain of springs follows the pointer with growing lag.',
  tag: 'springs',
} as const

const LINKS = 6

export default function CursorTrail() {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Hooks order is stable for a fixed LINKS, so calling useSpring in a loop is safe.
  const trail = [
    {
      x: useSpring(x, { stiffness: 360, damping: 26 }),
      y: useSpring(y, { stiffness: 360, damping: 26 }),
    },
    {
      x: useSpring(x, { stiffness: 315, damping: 26 }),
      y: useSpring(y, { stiffness: 315, damping: 26 }),
    },
    {
      x: useSpring(x, { stiffness: 270, damping: 26 }),
      y: useSpring(y, { stiffness: 270, damping: 26 }),
    },
    {
      x: useSpring(x, { stiffness: 225, damping: 26 }),
      y: useSpring(y, { stiffness: 225, damping: 26 }),
    },
    {
      x: useSpring(x, { stiffness: 180, damping: 26 }),
      y: useSpring(y, { stiffness: 180, damping: 26 }),
    },
    {
      x: useSpring(x, { stiffness: 135, damping: 26 }),
      y: useSpring(y, { stiffness: 135, damping: 26 }),
    },
  ]

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x.set(e.clientX - rect.left)
      y.set(e.clientY - rect.top)
    }
    el.addEventListener('pointermove', handle)
    return () => el.removeEventListener('pointermove', handle)
  }, [x, y])

  return (
    <div
      ref={boxRef}
      className="relative h-56 w-56 overflow-hidden rounded-3xl border border-border bg-card"
    >
      {trail.map((t, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-grad-rose"
          style={{
            x: t.x,
            y: t.y,
            opacity: 1 - i / LINKS,
            scale: 1 - i / (LINKS * 1.5),
          }}
        />
      ))}
    </div>
  )
}
