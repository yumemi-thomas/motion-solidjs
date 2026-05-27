import { Presence, motion } from 'solidjs-motion'
import { For, Show, createSignal } from 'solid-js'
import { TodoNotice } from '~/components/TodoNotice'

export const meta = {
  slug: 'animate-presence-modes',
  title: 'Presence — modes',
  category: 'animate-presence',
  description: 'Compare sync and wait side by side.',
  tag: 'mode',
} as const

// solidjs-motion's Presence supports only "sync" | "wait" (no "popLayout").
const modes = ['sync', 'wait'] as const
type Mode = (typeof modes)[number]

function ModeCell(props: { mode: Mode; on: boolean }) {
  return (
    <div class="flex flex-col items-center gap-2">
      <div class="relative grid h-16 w-16 place-items-center">
        <Presence mode={props.mode}>
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
        </Presence>
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
      <TodoNotice>
        solidjs-motion’s Presence supports only “sync” and “wait” — the “popLayout” mode is omitted.
      </TodoNotice>
    </div>
  )
}
