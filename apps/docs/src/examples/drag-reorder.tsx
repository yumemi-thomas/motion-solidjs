import { Reorder } from 'motion-solidjs'
import { For, createSignal } from 'solid-js'

export const meta = {
  slug: 'drag-reorder',
  title: 'Reorder list',
  category: 'drag',
  description: 'Drag the rows to reorder them — values stay in sync.',
  tag: 'Reorder',
} as const

const initial = [
  { id: 'rose', label: 'Rose', color: 'bg-grad-rose' },
  { id: 'violet', label: 'Violet', color: 'bg-grad-violet' },
  { id: 'mint', label: 'Mint', color: 'bg-grad-mint' },
  { id: 'amber', label: 'Amber', color: 'bg-grad-amber' },
]

export default function DragReorder() {
  const [items, setItems] = createSignal(initial)

  return (
    <Reorder.Group axis="y" values={items()} onReorder={setItems} class="flex w-56 flex-col gap-2">
      <For each={items()}>
        {(it) => (
          <Reorder.Item
            value={it}
            class="flex cursor-grab items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-xs active:cursor-grabbing"
            whileTap={{ scale: 1.04 }}
          >
            <span class={`h-6 w-6 rounded-lg ${it.color}`} />
            <span class="font-medium">{it.label}</span>
            <span class="ml-auto text-fg-dim">⇅</span>
          </Reorder.Item>
        )}
      </For>
    </Reorder.Group>
  )
}
