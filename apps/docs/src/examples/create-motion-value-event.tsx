import { motion, createMotionValue, createMotionValueEvent } from 'motion-solidjs'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'create-motion-value-event',
  title: 'createMotionValueEvent',
  category: 'motion-values',
  description: 'Subscribe to every change of a motion value — drag and watch the readout.',
  tag: 'createMotionValueEvent',
} as const

export default function UseMotionValueEventExample() {
  const x = createMotionValue(0)
  const [latest, setLatest] = createSignal('0.0')

  // Fires on every committed change to `x` — including each drag frame.
  createMotionValueEvent(x, 'change', (value) => {
    setLatest(value.toFixed(1))
  })

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="relative flex h-20 w-64 items-center justify-center rounded-2xl border border-border bg-card">
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x }}
          class="h-14 w-14 cursor-grab rounded-2xl bg-grad-violet shadow-glow active:cursor-grabbing"
        />
      </div>
      <div class="font-mono text-xs tabular-nums text-fg-muted">
        x = <span class="text-fg">{latest()}</span>
      </div>
    </div>
  )
}
