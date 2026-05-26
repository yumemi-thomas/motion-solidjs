import { motion, createScroll, createTransform } from 'motion-solidjs'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'parallax',
  title: 'Parallax layers',
  category: 'scroll',
  description: 'Two shapes drift at different speeds as you scroll the box.',
  tag: 'createTransform',
} as const

export default function Parallax() {
  const [container, setContainer] = createSignal<HTMLDivElement | null>(null)
  const { scrollYProgress } = createScroll({ container })
  const yBack = createTransform(scrollYProgress, [0, 1], [0, -80])
  const yFront = createTransform(scrollYProgress, [0, 1], [0, -160])

  return (
    <div
      ref={setContainer}
      class="relative h-64 w-56 overflow-y-scroll rounded-2xl border border-border bg-card"
    >
      <div class="pointer-events-none sticky top-0 h-0">
        <motion.div
          style={{ y: yBack }}
          class="absolute top-10 left-6 h-20 w-20 rounded-2xl bg-grad-violet opacity-60 blur-[2px]"
        />
        <motion.div
          style={{ y: yFront }}
          class="absolute top-24 right-6 h-12 w-12 rounded-2xl bg-grad-rose"
        />
      </div>
      <div class="p-4 text-xs text-fg-muted">
        {Array.from({ length: 18 }).map((_, i) => (
          <p class="py-2">Scroll line {i + 1}</p>
        ))}
      </div>
    </div>
  )
}
