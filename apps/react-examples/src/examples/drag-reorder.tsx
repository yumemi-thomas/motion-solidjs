import { Reorder } from 'motion/react'
import { useState } from 'react'

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
  const [items, setItems] = useState(initial)

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={setItems}
      className="flex w-56 flex-col gap-2"
    >
      {items.map((it) => (
        <Reorder.Item
          key={it.id}
          value={it}
          className="flex cursor-grab items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-xs active:cursor-grabbing"
          whileTap={{ scale: 1.04 }}
        >
          <span className={`h-6 w-6 rounded-lg ${it.color}`} />
          <span className="font-medium">{it.label}</span>
          <span className="ml-auto text-fg-dim">⇅</span>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}
