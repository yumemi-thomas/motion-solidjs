import { motion } from 'solidjs-motion'
import { For, createSignal, onCleanup, onMount } from 'solid-js'

export const meta = {
  slug: 'layout-shuffle',
  title: 'Layout — shuffle',
  category: 'layout',
  description: 'A list of items reshuffles every second; layout springs them into place.',
  tag: 'layout',
} as const

const initialOrder = ['#ff0088', '#dd00ee', '#9911ff', '#0d63f8']

function shuffle<T>(input: readonly T[]) {
  return [...input].sort(() => Math.random() - 0.5)
}

export default function LayoutShuffle() {
  const [order, setOrder] = createSignal<string[]>([...initialOrder])

  onMount(() => {
    const id = window.setInterval(() => setOrder((o) => shuffle(o)), 1000)
    onCleanup(() => window.clearInterval(id))
  })

  return (
    <ul
      class="grid w-[180px] grid-cols-2 gap-2"
      style={{ 'list-style': 'none', padding: 0, margin: 0 }}
    >
      <For each={order()}>
        {(color) => (
          <motion.li
            data-state={order()}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            class="aspect-square rounded-xl"
            style={{ 'background-color': color }}
          />
        )}
      </For>
    </ul>
  )
}
