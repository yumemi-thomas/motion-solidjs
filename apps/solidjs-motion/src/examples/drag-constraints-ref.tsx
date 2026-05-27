import { motion } from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'drag-constraints-ref',
  title: 'Drag — bounded by parent',
  category: 'drag',
  description: 'Pass a DOM element as constraint — the box stays inside.',
  tag: 'dragConstraints={ref}',
} as const

export default function DragConstraintsRef() {
  const [parent, setParent] = createSignal<HTMLElement | null>(null)

  return (
    <div
      ref={setParent}
      class="relative h-56 w-64 rounded-2xl border border-dashed border-border-strong bg-card"
    >
      <motion.div
        drag
        dragConstraints={parent() ?? undefined}
        dragElastic={0.15}
        class="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-xl bg-grad-violet shadow-glow active:cursor-grabbing"
      />
    </div>
  )
}
