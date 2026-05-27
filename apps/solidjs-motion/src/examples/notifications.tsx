import { Presence, motion } from 'solidjs-motion'
import { For, createSignal } from 'solid-js'

export const meta = {
  slug: 'notifications',
  title: 'Notifications stack',
  category: 'animate-presence',
  description: 'Items spring in, fall out and the stack reflows.',
  tag: 'list',
} as const

interface Note {
  id: number
  text: string
}

const messages = [
  'Build deploy succeeded',
  'You have a new follower',
  '3 unread messages',
  'PR opened on solidjs-motion',
  'CI passed on main',
]

let nextId = 1

export default function Notifications() {
  const [notes, setNotes] = createSignal<Note[]>([{ id: nextId++, text: messages[0] }])

  const add = () => {
    setNotes((n) => [...n, { id: nextId, text: messages[(nextId++ - 1) % messages.length] }])
  }
  const remove = (id: number) => setNotes((n) => n.filter((x) => x.id !== id))

  return (
    <div class="flex w-72 flex-col gap-3">
      <button
        onClick={add}
        class="self-start rounded-full bg-grad-rose px-4 py-1.5 text-xs font-semibold text-white"
      >
        + Add notification
      </button>
      <ul class="flex flex-col gap-2">
        <Presence>
          <For each={notes()}>
            {(note) => (
              <motion.li
                class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5 text-xs"
                initial={{ opacity: 0, x: -40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                layout
              >
                <span>{note.text}</span>
                <button onClick={() => remove(note.id)} class="text-fg-dim hover:text-fg">
                  ×
                </button>
              </motion.li>
            )}
          </For>
        </Presence>
      </ul>
    </div>
  )
}
