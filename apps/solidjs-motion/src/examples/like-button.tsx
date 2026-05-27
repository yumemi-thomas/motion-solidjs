import { Presence, motion } from 'solidjs-motion'
import { For, Show, createSignal } from 'solid-js'

export const meta = {
  slug: 'like-button',
  title: 'Fancy like button',
  category: 'showcase',
  description: 'A heart pops, particles burst, and the count slides up.',
  tag: 'micro',
} as const

const particleAngles = [-60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270]

export default function LikeButton() {
  const [liked, setLiked] = createSignal(false)
  const [count, setCount] = createSignal(128)

  const toggle = () => {
    setLiked((v) => !v)
    setCount((c) => c + (liked() ? -1 : 1))
  }

  return (
    <button
      onClick={toggle}
      class="relative flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
    >
      <span class="relative grid place-items-center">
        <motion.span
          animate={liked() ? { scale: [1, 0.7, 1.4, 1], rotate: [0, 0, -10, 0] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          class={liked() ? 'text-pink-500' : 'text-fg-dim'}
        >
          ♥
        </motion.span>
        <Presence>
          <Show when={liked()}>
            <span class="pointer-events-none absolute inset-0">
              <For each={particleAngles}>
                {(angle) => (
                  <motion.span
                    class="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos((angle * Math.PI) / 180) * 22,
                      y: Math.sin((angle * Math.PI) / 180) * 22,
                      opacity: 0,
                      scale: 0.3,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )}
              </For>
            </span>
          </Show>
        </Presence>
      </span>
      <span class="font-mono tabular-nums">{count()}</span>
    </button>
  )
}
