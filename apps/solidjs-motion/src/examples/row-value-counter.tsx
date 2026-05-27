// solidjs-motion has no `<RowValue>` component — its MotionValues are Solid
// accessors, so render one inline by calling it: `{rounded()}`.
import {
  animate,
  motionValue,
  motion,
  createTransform,
  createMotionValueEvent,
} from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'row-value-counter',
  title: 'RowValue counter',
  category: 'motion-values',
  description: 'Animate a MotionValue and read it inline with <RowValue>.',
  tag: 'RowValue',
} as const

export default function RowValueCounter() {
  const count = motionValue(0)
  // solidjs-motion's createTransform only does range mapping (no function
  // form), so mirror the rounded value into a signal for the readout.
  const [rounded, setRounded] = createSignal(0)
  createMotionValueEvent(count, 'change', (v) => setRounded(Math.round(v)))
  const width = createTransform(count, [0, 100], ['0%', '100%'])

  const run = () => {
    count.set(0)
    animate(count, 100, { duration: 2, ease: 'easeOut' })
  }

  return (
    <div class="flex w-64 flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-glow">
      <div class="flex w-full items-baseline justify-between">
        <span class="text-sm text-fg-muted">Progress</span>
        <span class="font-mono text-3xl tabular-nums">{rounded()}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-grad-violet/20">
        <motion.div class="h-full rounded-full bg-grad-mint" style={{ width }} />
      </div>
      <button
        type="button"
        onClick={run}
        class="w-full rounded-xl bg-grad-rose px-3 py-2 text-sm font-medium text-white shadow-glow"
      >
        Run
      </button>
    </div>
  )
}
