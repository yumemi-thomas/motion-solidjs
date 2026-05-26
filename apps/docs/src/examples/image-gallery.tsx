import { AnimatePresence, motion } from 'motion-solidjs'
import { Show, createSignal } from 'solid-js'

export const meta = {
  slug: 'image-gallery',
  title: 'Image gallery',
  category: 'animate-presence',
  description: 'Directional slide-and-fade as you page through.',
  tag: 'pagination',
} as const

const palettes = [
  'from-[#ff4d8d] via-[#ff9466] to-[#ffd166]',
  'from-[#7c5cff] via-[#36b0ff] to-[#36e0c5]',
  'from-[#36e0c5] via-[#4ad991] to-[#ffd166]',
  'from-[#c44eff] via-[#ff4d8d] to-[#ff9466]',
]

export default function ImageGallery() {
  const [i, setI] = createSignal(0)
  const [dir, setDir] = createSignal<1 | -1>(1)

  const page = (d: 1 | -1) => {
    setDir(d)
    setI((v) => (v + d + palettes.length) % palettes.length)
  }

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="relative h-32 w-52 overflow-hidden rounded-2xl">
        <AnimatePresence mode="popLayout">
          <Show when={palettes[i()]} keyed>
            {(palette) => (
              <motion.div
                class={`absolute inset-0 bg-gradient-to-br ${palette}`}
                initial={{ x: dir() * 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: dir() * -200, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              />
            )}
          </Show>
        </AnimatePresence>
      </div>
      <div class="flex gap-2">
        <button
          onClick={() => page(-1)}
          class="rounded-full border border-border bg-card px-3 py-1 text-xs text-fg-muted hover:text-fg"
        >
          ←
        </button>
        <span class="rounded-full border border-border bg-card px-3 py-1 text-xs font-mono text-fg-muted">
          {i() + 1} / {palettes.length}
        </span>
        <button
          onClick={() => page(1)}
          class="rounded-full border border-border bg-card px-3 py-1 text-xs text-fg-muted hover:text-fg"
        >
          →
        </button>
      </div>
    </div>
  )
}
