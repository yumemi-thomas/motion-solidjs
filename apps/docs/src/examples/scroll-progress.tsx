import { motion, createScroll, createSpring } from 'motion-solidjs'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'scroll-progress',
  title: 'Scroll progress',
  category: 'scroll',
  description: 'A spring-smoothed scrollYProgress on the inner container.',
  tag: 'createScroll',
} as const

export default function ScrollProgress() {
  const [container, setContainer] = createSignal<HTMLDivElement | null>(null)
  const { scrollYProgress } = createScroll({ container })
  const smooth = createSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <div
      ref={setContainer}
      class="relative h-64 w-56 overflow-y-scroll rounded-2xl border border-border bg-card"
    >
      <motion.span
        class="sticky top-0 left-0 z-10 block h-1 origin-left bg-grad-rose"
        style={{ scaleX: smooth }}
      />
      <div class="space-y-3 p-4 text-xs leading-relaxed text-fg-muted">
        {Array.from({ length: 20 }).map((_, i) => (
          <p>Scroll line {i + 1}. The bar tracks scrollYProgress smoothly.</p>
        ))}
      </div>
    </div>
  )
}
