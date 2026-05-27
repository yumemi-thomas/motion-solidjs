// solidjs-motion has no `createComputed`. Its MotionValues are Solid
// accessors, so a derived MotionValue is just an effect that .set()s it —
// reading x()/y() inside the effect auto-tracks both sources.
import { motion, createMotionValue, createMotionValueEvent, createTransform } from 'solidjs-motion'
import { createEffect, createSignal } from 'solid-js'

export const meta = {
  slug: 'create-computed',
  title: 'createComputed',
  category: 'motion-values',
  description: 'Derive a motion value from a getter — dependencies are auto-tracked.',
  tag: 'createComputed',
} as const

export default function UseComputedExample() {
  const x = createMotionValue(0)
  const y = createMotionValue(0)

  // Reading the accessors inside the effect auto-collects both as
  // dependencies; `distance` updates whenever either source changes.
  const distance = createMotionValue(0)
  createEffect(() => distance.set(Math.hypot(x(), y())))

  // Pipe the derived motion value into ordinary transforms.
  const scale = createTransform(distance, [0, 140], [1, 1.8], { clamp: true })
  const bg = createTransform(distance, [0, 140], ['#7c5cff', '#ff4d8d'], { clamp: true })

  // Mirror the derived value into a signal for the text readout.
  const [readout, setReadout] = createSignal('0.0')
  createMotionValueEvent(distance, 'change', (d) => setReadout(d.toFixed(1)))

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="relative grid h-56 w-56 place-items-center rounded-3xl border border-border bg-card">
        <motion.div
          drag
          dragConstraints={{ left: -90, right: 90, top: -90, bottom: 90 }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x, y, 'background-color': bg, scale }}
          class="h-12 w-12 cursor-grab rounded-full shadow-glow active:cursor-grabbing"
        />
      </div>
      <div class="font-mono text-xs tabular-nums text-fg-muted">
        distance = <span class="text-fg">{readout()}</span>
      </div>
    </div>
  )
}
