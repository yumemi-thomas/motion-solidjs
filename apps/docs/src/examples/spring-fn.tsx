import { animate, spring } from 'motion-solidjs'
import { createSignal, For } from 'solid-js'

export const meta = {
  slug: 'spring-fn',
  title: 'spring()',
  category: 'animations',
  description: 'Use the spring generator with animate() — switch stiffness on the fly.',
  tag: 'generator',
} as const

const presets = [
  { label: 'Soft', stiffness: 120, damping: 18 },
  { label: 'Snappy', stiffness: 280, damping: 18 },
  { label: 'Bouncy', stiffness: 360, damping: 10 },
]

export default function SpringFnExample() {
  const [el, setEl] = createSignal<HTMLDivElement | null>(null)
  const [picked, setPicked] = createSignal(presets[1])
  const [toggled, setToggled] = createSignal(false)

  const fire = () => {
    const node = el() as Element | null
    if (!node) return
    const next = !toggled()
    setToggled(next)
    const opts = picked()
    animate(
      node,
      { x: next ? 180 : 0 },
      { type: spring, stiffness: opts.stiffness, damping: opts.damping },
    )
  }

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="relative h-20 w-64 rounded-2xl border border-border bg-card/40">
        <div
          ref={setEl}
          class="absolute top-2 left-2 h-16 w-16 rounded-2xl bg-grad-amber shadow-glow"
        />
      </div>
      <div class="flex gap-2">
        <For each={presets}>
          {(p) => (
            <button
              onClick={() => setPicked(p)}
              class={`rounded-full border px-3 py-1 text-xs ${
                picked().label === p.label
                  ? 'border-border bg-card text-fg'
                  : 'border-border bg-transparent text-fg-dim hover:text-fg-muted'
              }`}
            >
              {p.label}
            </button>
          )}
        </For>
      </div>
      <button
        onClick={fire}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Spring
      </button>
    </div>
  )
}
