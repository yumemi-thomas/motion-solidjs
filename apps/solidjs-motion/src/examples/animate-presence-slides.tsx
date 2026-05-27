import { Presence, motion } from 'solidjs-motion'
// `wrap` isn't re-exported by solidjs-motion; it lives in motion-utils.
import { wrap } from 'motion-utils'
import { Show, createSignal } from 'solid-js'

export const meta = {
  slug: 'animate-presence-slides',
  title: 'Presence — slide carousel',
  category: 'animate-presence',
  description: 'Arrow buttons slide a card; exit direction depends on the press.',
  tag: 'popLayout',
} as const

const colors = ['#ff5d9e', '#ffd166', '#36e0c5', '#7c5cff', '#ff8b3d', '#0cdcf7']

export default function AnimatePresenceSlides() {
  const [index, setIndex] = createSignal(0)
  const [direction, setDirection] = createSignal<1 | -1>(1)

  const slide = (delta: 1 | -1) => {
    setDirection(delta)
    setIndex((i) => wrap(0, colors.length, i + delta))
  }

  return (
    <div class="flex items-center gap-4">
      <button
        aria-label="Previous"
        onClick={() => slide(-1)}
        class="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-fg-muted hover:text-fg"
      >
        ←
      </button>
      <div class="relative grid h-24 w-24 place-items-center">
        {/* solidjs-motion's Presence supports only "sync" | "wait" (no
            "popLayout"). The cards are absolutely positioned, so "sync"
            overlaps enter/exit cleanly without popLayout. */}
        <Presence mode="sync">
          <Show when={colors[index()]} keyed>
            {(color) => {
              const enterFrom = direction() * 60
              const exitTo = direction() * -60
              return (
                <motion.div
                  class="absolute h-24 w-24 rounded-2xl"
                  initial={{ opacity: 0, x: enterFrom }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                      delay: 0.1,
                      type: 'spring',
                      stiffness: 320,
                      damping: 26,
                    },
                  }}
                  exit={{ opacity: 0, x: exitTo }}
                  style={{ 'background-color': color }}
                />
              )
            }}
          </Show>
        </Presence>
      </div>
      <button
        aria-label="Next"
        onClick={() => slide(1)}
        class="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-fg-muted hover:text-fg"
      >
        →
      </button>
    </div>
  )
}
