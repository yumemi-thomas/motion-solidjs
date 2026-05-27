import { animate } from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'animate-fn',
  title: 'animate()',
  category: 'animations',
  description: 'The imperative animate() function — drive a DOM element from a click handler.',
  tag: 'imperative',
} as const

export default function AnimateFnExample() {
  const [el, setEl] = createSignal<HTMLDivElement | null>(null)
  const [running, setRunning] = createSignal(false)

  const play = async () => {
    const node = el()
    if (!node || running()) return
    setRunning(true)

    const forward = animate(
      node,
      { x: 180, rotate: 90 },
      { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    )
    await forward.finished

    const back = animate(node, { x: 0, rotate: 0 }, { type: 'spring', stiffness: 220, damping: 14 })
    await back.finished

    setRunning(false)
  }

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="relative h-20 w-64 rounded-2xl border border-border bg-card/40">
        <div
          ref={setEl}
          class="absolute top-2 left-2 h-16 w-16 rounded-2xl bg-grad-rose shadow-glow"
        />
      </div>
      <button
        onClick={play}
        disabled={running()}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg disabled:opacity-50"
      >
        {running() ? 'Playing…' : 'Play'}
      </button>
    </div>
  )
}
