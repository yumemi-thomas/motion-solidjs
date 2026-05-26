import { arc, motion } from 'motion-solidjs'
import { createMemo, createSignal } from 'solid-js'

export const meta = {
  slug: 'transition-arc',
  title: 'Transition along an arc',
  category: 'animations',
  description:
    'Set `transition.path = arc()` to follow a curved bezier path between keyframes instead of the default straight line.',
  tag: 'transition.path',
} as const

const POSITIONS = [
  { id: 'a', x: 0, y: 0 },
  { id: 'b', x: 220, y: 0 },
] as const
type PositionId = (typeof POSITIONS)[number]['id']

export default function TransitionArc() {
  const [target, setTarget] = createSignal<PositionId>('a')
  const [strength, setStrength] = createSignal(1)
  const [rotateScale, setRotateScale] = createSignal(0)

  // Reuse the factory across renders so its dominant-axis-change closure
  // stays alive — see arc()'s JSDoc. createMemo recomputes only when
  // strength / rotateScale change.
  const path = createMemo(() =>
    arc({ strength: strength(), rotate: rotateScale() === 0 ? false : rotateScale() }),
  )

  const pos = createMemo(() => POSITIONS.find((p) => p.id === target())!)

  return (
    <div class="flex flex-col items-center gap-6">
      <div class="relative h-44 w-72 rounded-2xl border border-border bg-card">
        <div
          class="absolute left-6 top-1/2 -translate-y-1/2 text-xs text-fg-muted"
          aria-hidden="true"
        >
          A
        </div>
        <div
          class="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-fg-muted"
          aria-hidden="true"
        >
          B
        </div>
        <motion.div
          class="absolute left-6 top-1/2 -mt-5 grid h-10 w-10 place-items-center rounded-xl bg-grad-rose text-lg"
          animate={{ x: pos().x, y: pos().y }}
          transition={{ duration: 1.2, ease: 'easeInOut', path: path() }}
        >
          ✦
        </motion.div>
      </div>

      <button
        onClick={() => setTarget((t) => (t === 'a' ? 'b' : 'a'))}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Toggle → {target() === 'a' ? 'B' : 'A'}
      </button>

      <div class="flex flex-col gap-3 text-xs text-fg-muted">
        <label class="flex items-center gap-3">
          <span class="w-24">strength</span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={strength()}
            onInput={(e) => setStrength(Number(e.currentTarget.value))}
            class="w-48"
          />
          <span class="w-10 text-right tabular-nums">{strength().toFixed(2)}</span>
        </label>
        <label class="flex items-center gap-3">
          <span class="w-24">rotate</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={rotateScale()}
            onInput={(e) => setRotateScale(Number(e.currentTarget.value))}
            class="w-48"
          />
          <span class="w-10 text-right tabular-nums">{rotateScale().toFixed(2)}</span>
        </label>
      </div>
    </div>
  )
}
