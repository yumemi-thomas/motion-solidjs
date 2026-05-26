import { motion, wrap } from 'motion-solidjs'
import { createSignal, For, Show } from 'solid-js'

export const meta = {
  slug: 'wrap-fn',
  title: 'wrap()',
  category: 'animations',
  description: 'Wrap a number into [min, max) — perfect for circular indices.',
  tag: 'utility',
} as const

const items = ['Aurora', 'Borealis', 'Cosmos', 'Drift', 'Ember']

export default function WrapFnExample() {
  const [index, setIndex] = createSignal(0)

  const step = (dir: 1 | -1) => setIndex((i) => wrap(0, items.length, i + dir))

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="flex gap-2">
        <For each={items}>
          {(_, i) => (
            <div class="relative h-14 w-14 rounded-2xl border border-border bg-card/40">
              <Show when={i() === index()}>
                <motion.div
                  layoutId="wrap-indicator"
                  class="absolute inset-0 rounded-2xl bg-grad-violet shadow-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              </Show>
            </div>
          )}
        </For>
      </div>
      <div class="flex items-center gap-3 text-xs text-fg-muted">
        <span class="tabular-nums text-fg-dim">#{index()}</span>
        <span class="min-w-[5rem] text-center text-fg">{items[index()]}</span>
      </div>
      <div class="flex gap-2">
        <button
          onClick={() => step(-1)}
          class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
        >
          Prev
        </button>
        <button
          onClick={() => step(1)}
          class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
        >
          Next
        </button>
      </div>
    </div>
  )
}
