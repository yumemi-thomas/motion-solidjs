import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

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
    <div className="flex flex-col items-center gap-2">
      <div className="relative grid h-16 w-16 place-items-center">
        <AnimatePresence mode={props.mode}>
          {props.on ? (
            <motion.div
              key="on"
              className="absolute h-14 w-14 rounded-full bg-grad-rose"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <motion.div
              key="off"
              className="absolute h-14 w-14 rounded-full border-2 border-fg"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </div>
      <code className="text-[11px] text-fg-muted">{props.mode}</code>
    </div>
  )
}

export default function AnimatePresenceModes() {
  const [on, setOn] = useState(true)
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-10">
        {modes.map((m) => (
          <ModeCell key={m} mode={m} on={on} />
        ))}
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Switch
      </button>
    </div>
  )
}
