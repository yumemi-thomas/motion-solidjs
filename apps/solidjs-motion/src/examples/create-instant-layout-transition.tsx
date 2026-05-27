// TODO(solidjs-motion): no `createInstantLayoutTransition` equivalent — there's
// no documented way to opt a single layout update out of its animation. The
// "Snap shuffle" button below therefore animates like the other one until the
// upstream package exposes an instant-transition escape hatch.
import { motion } from 'solidjs-motion'
import { For, createSignal } from 'solid-js'
import { TodoNotice } from '~/components/TodoNotice'

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

  return (
    <div class="flex flex-col items-center gap-3">
      <ul
        class="grid w-[180px] grid-cols-2 gap-2"
        style={{ 'list-style': 'none', padding: 0, margin: 0 }}
      >
        <For each={order()}>
          {(color) => (
            <motion.li
              data-state={order()}
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
          // TODO(solidjs-motion): should snap instantly; no instant-layout API yet.
          onClick={() => setOrder((o) => shuffle(o))}
          class="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
        >
          Snap shuffle
        </button>
      </div>
      <TodoNotice>
        solidjs-motion has no instant-layout-transition API, so “Snap shuffle” animates instead of
        snapping.
      </TodoNotice>
    </div>
  )
}
