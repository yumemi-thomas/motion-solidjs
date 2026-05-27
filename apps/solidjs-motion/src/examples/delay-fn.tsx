// `delay` isn't re-exported by solidjs-motion; it lives in motion-dom.
import { delay } from 'motion-dom'
import { createSignal, onCleanup, Show } from 'solid-js'

export const meta = {
  slug: 'delay-fn',
  title: 'delay()',
  category: 'animations',
  description: 'A cancellable, frame-aware setTimeout — returns a cancel function.',
  tag: 'utility',
} as const

type Status = 'idle' | 'scheduled' | 'cancelled' | 'done'

export default function DelayFnExample() {
  const [status, setStatus] = createSignal<Status>('idle')
  const [cancelFn, setCancelFn] = createSignal<(() => void) | null>(null)

  const start = () => {
    cancelFn()?.()
    setStatus('scheduled')
    const cancel = delay(() => {
      setStatus('done')
      setCancelFn(null)
    }, 1500)
    setCancelFn(() => cancel)
  }

  const cancel = () => {
    cancelFn()?.()
    setCancelFn(null)
    setStatus('cancelled')
  }

  onCleanup(() => cancelFn()?.())

  const tone: Record<Status, string> = {
    idle: 'text-fg-dim',
    scheduled: 'text-fg-muted',
    cancelled: 'text-fg-dim',
    done: 'text-fg',
  }

  return (
    <div class="flex flex-col items-center gap-4">
      <Show
        when={status() === 'done'}
        fallback={<div class="h-16 w-16 rounded-2xl border border-border bg-card/40" />}
      >
        <div class="h-16 w-16 rounded-2xl bg-grad-violet shadow-glow" />
      </Show>
      <span class={`text-xs tabular-nums ${tone[status()]}`}>{status()}</span>
      <div class="flex gap-2">
        <button
          onClick={start}
          class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
        >
          Start (1.5s)
        </button>
        <button
          onClick={cancel}
          disabled={status() !== 'scheduled'}
          class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
