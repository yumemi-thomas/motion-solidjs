// solidjs-motion has no `createFollowValue`. A tween-based follow is a short
// helper: mirror the source into a new MotionValue, retargeting an `animate`
// tween on every change (no spring physics → no overshoot).
import { animate, motion, createMotionValue, createMotionValueEvent } from 'solidjs-motion'
import type { MotionValue, Transition } from 'solidjs-motion'

function createFollowValue(source: MotionValue<number>, transition: Transition) {
  const out = createMotionValue(source.get())
  createMotionValueEvent(source, 'change', (v) => {
    animate(out, v, transition)
  })
  return out
}

export const meta = {
  slug: 'create-follow-value',
  title: 'createFollowValue',
  category: 'motion-values',
  description: 'Trail a source value with a tween — no spring physics, no overshoot.',
  tag: 'createFollowValue',
} as const

export default function UseFollowValueExample() {
  const x = createMotionValue(0)
  const y = createMotionValue(0)

  // A tween-based follow. Unlike createSpring this has a fixed duration and
  // easing — the trailer lerps to the latest value with no bounce.
  const followX = createFollowValue(x, { type: 'tween', duration: 0.4, ease: 'easeOut' })
  const followY = createFollowValue(y, { type: 'tween', duration: 0.4, ease: 'easeOut' })

  return (
    <div class="flex flex-col items-center gap-3">
      <div class="relative grid h-56 w-56 place-items-center rounded-3xl border border-border bg-card">
        {/* Trailer — lags behind on a fixed-duration tween. */}
        <motion.span
          class="pointer-events-none absolute h-14 w-14 rounded-2xl bg-grad-amber/60 shadow-glow"
          style={{ x: followX, y: followY }}
        />
        {/* Leader — dragged by the user. */}
        <motion.div
          drag
          dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x, y }}
          class="relative h-14 w-14 cursor-grab rounded-2xl bg-grad-rose shadow-glow active:cursor-grabbing"
        />
      </div>
      <span class="font-mono text-xs text-fg-dim">drag — trailer lerps on a tween</span>
    </div>
  )
}
