import { motion } from 'motion-solidjs'
import { For, createSignal } from 'solid-js'

export const meta = {
  slug: 'layout-list',
  title: 'Layout — list reflow',
  category: 'layout',
  description: 'Layout siblings reflow with springs when an item is removed.',
  tag: 'layout',
} as const

const seed = ['Spring', 'Tween', 'Inertia', 'Keyframes', 'Layout']

export default function LayoutList() {
  const [items, setItems] = createSignal(seed)
  return (
    <div class="flex w-72 flex-col gap-2">
      <For each={items()}>
        {(item) => (
          <motion.button
            layout
            onClick={() => setItems((xs) => xs.filter((x) => x !== item))}
            class="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-xs hover:bg-card-hover"
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {item}
          </motion.button>
        )}
      </For>
      <button
        onClick={() => setItems(seed)}
        class="self-start rounded-full border border-border bg-card px-3 py-1 text-xs text-fg-dim hover:text-fg"
      >
        Reset
      </button>
    </div>
  )
}
