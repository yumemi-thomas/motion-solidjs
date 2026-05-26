import { AnimatePresence, motion } from 'motion-solidjs'
import { For, Show, createSignal } from 'solid-js'

export const meta = {
  slug: 'animate-presence-modes',
  title: 'AnimatePresence — modes',
  category: 'animate-presence',
  description: 'Compare sync, wait and popLayout side by side.',
  tag: 'mode',
} as const

const modes = ['sync', 'wait', 'popLayout'] as const
type Mode = (typeof modes)[number]

function ModeCell(props: { mode: Mode; on: boolean }) {
  return (
    <div class="flex flex-col items-center gap-2">
      <div class="relative grid h-16 w-16 place-items-center">
        <AnimatePresence mode={props.mode}>
          <Show when={props.on} keyed>
            <motion.div
              class="absolute h-14 w-14 rounded-full bg-grad-rose"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          </Show>
          <Show when={!props.on} keyed>
            <motion.div
              class="absolute h-14 w-14 rounded-full border-2 border-fg"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          </Show>
        </AnimatePresence>
      </div>
      <code class="text-[11px] text-fg-muted">{props.mode}</code>
    </div>
  )
}

export default function AnimatePresenceModes() {
  const [on, setOn] = createSignal(true)
  return (
    <div class="flex flex-col items-center gap-6">
      <div class="flex gap-10">
        <For each={modes}>{(m) => <ModeCell mode={m} on={on()} />}</For>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Switch
      </button>
    </div>
  )
}
