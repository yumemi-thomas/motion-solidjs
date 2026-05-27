// solidjs-motion has no scoped `createAnimate` (deferred to v0.3+). Use the
// re-exported `animate` against a ref'd element — same engine, same sequencing.
import { animate } from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'create-animate',
  title: 'createAnimate',
  category: 'motion-values',
  description: 'Imperative animation — chain steps inside a click handler.',
  tag: 'imperative',
} as const

export default function UseAnimateExample() {
  const [el, setEl] = createSignal<HTMLDivElement>()

  const run = async () => {
    const node = el()
    if (!node) return
    await animate(node, { rotate: 360, scale: 1.4 }, { duration: 0.4 })
    await animate(
      node,
      { scale: 0.7, borderRadius: '50%' },
      { type: 'spring', stiffness: 320, damping: 14 },
    )
    await animate(
      node,
      { scale: 1, rotate: 0, borderRadius: '20%' },
      { type: 'spring', stiffness: 200, damping: 18 },
    )
  }

  return (
    <div class="flex flex-col items-center gap-3">
      <div ref={setEl} class="h-20 w-20 rounded-[20%] bg-grad-rose shadow-glow" />
      <button
        onClick={run}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Run sequence
      </button>
    </div>
  )
}
