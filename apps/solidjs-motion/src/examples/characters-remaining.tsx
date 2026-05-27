import { motion, createTemplate, createSpring, createTransform } from 'solidjs-motion'
import { createEffect, createSignal } from 'solid-js'

export const meta = {
  slug: 'characters-remaining',
  title: 'Characters remaining',
  category: 'showcase',
  description: 'A circle ring shrinks toward the limit, color warms past 80%.',
  tag: 'progress',
} as const

const LIMIT = 60

export default function CharactersRemaining() {
  const [text, setText] = createSignal('')
  const ringRatio = createSpring(() => Math.min(1, text().length / LIMIT), {
    stiffness: 200,
    damping: 24,
  })

  const onInput = (e: Event) => {
    setText((e.currentTarget as HTMLInputElement).value)
  }

  const dash = createTransform(ringRatio, [0, 1], [0, 88])
  const color = createTransform(
    ringRatio,
    [0, 0.6, 0.85, 1],
    ['#36e0c5', '#ffd166', '#ff8a5b', '#ff4d8d'],
  )
  const strokeStyle = createTemplate`${dash} 88`

  return (
    <div class="flex w-64 flex-col items-center gap-3">
      <input
        value={text()}
        onInput={onInput}
        maxLength={LIMIT}
        placeholder="Type something..."
        class="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-fg-dim"
      />
      <div class="relative grid h-14 w-14 place-items-center">
        <svg viewBox="0 0 32 32" class="absolute inset-0 -rotate-90">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#23232f" stroke-width="3" />
          <motion.circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke-width="3"
            stroke-linecap="round"
            style={{ stroke: color, 'stroke-dasharray': strokeStyle }}
          />
        </svg>
        <span class="font-mono text-xs tabular-nums">{LIMIT - text().length}</span>
      </div>
    </div>
  )
}
