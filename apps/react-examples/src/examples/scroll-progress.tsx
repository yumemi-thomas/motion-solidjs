import { motion, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'

export const meta = {
  slug: 'scroll-progress',
  title: 'Scroll progress',
  category: 'scroll',
  description: 'A spring-smoothed scrollYProgress on the inner container.',
  tag: 'useScroll',
} as const

export default function ScrollProgress() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <div
      ref={containerRef}
      className="relative h-64 w-56 overflow-y-scroll rounded-2xl border border-border bg-card"
    >
      <motion.span
        className="sticky top-0 left-0 z-10 block h-1 origin-left bg-grad-rose"
        style={{ scaleX: smooth }}
      />
      <div className="space-y-3 p-4 text-xs leading-relaxed text-fg-muted">
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i}>Scroll line {i + 1}. The bar tracks scrollYProgress smoothly.</p>
        ))}
      </div>
    </div>
  )
}
