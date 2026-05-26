import { motion, createInstantLayoutTransition } from 'motion-solidjs'
import { For, createSignal } from 'solid-js'

export const meta = {
  slug: 'create-instant-layout-transition',
  title: 'createInstantLayoutTransition',
  category: 'layout',
  description: 'Skip the layout animation for a single update — instant snap vs animated reorder.',
  tag: 'instant',
} as const

const initialOrder = ['#ff0088', '#dd00ee', '#9911ff', '#0d63f8']

function shuffle<T>(input: readonly T[]) {
  return [...input].sort(() => Math.random() - 0.5)
}

export default function UseInstantLayoutTransitionExample() {
  const [order, setOrder] = createSignal<string[]>([...initialOrder])
  const startInstant = createInstantLayoutTransition()

  return (
    <div class="flex flex-col items-center gap-3">
      <ul
        class="grid w-[180px] grid-cols-2 gap-2"
        style={{ 'list-style': 'none', padding: 0, margin: 0 }}
      >
        <For each={order()}>
          {(color) => (
            <motion.li
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              class="aspect-square rounded-xl"
              style={{ 'background-color': color }}
            />
          )}
        </For>
      </ul>
      <div class="flex gap-2">
        <button
          onClick={() => setOrder((o) => shuffle(o))}
          class="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
        >
          Animate shuffle
        </button>
        <button
          onClick={() => startInstant(() => setOrder((o) => shuffle(o)))}
          class="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
        >
          Snap shuffle
        </button>
      </div>
    </div>
  )
}
