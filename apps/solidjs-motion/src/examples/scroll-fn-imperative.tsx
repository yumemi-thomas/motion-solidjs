import { scroll } from 'solidjs-motion'
import { createSignal, createEffect, onCleanup, For } from 'solid-js'

export const meta = {
  slug: 'scroll-fn-imperative',
  title: 'scroll()',
  category: 'scroll',
  description: 'Imperative scroll() — drive a progress bar with a callback.',
  tag: 'imperative',
} as const

export default function ScrollFnImperativeExample() {
  const [container, setContainer] = createSignal<HTMLDivElement | null>(null)
  const [bar, setBar] = createSignal<HTMLDivElement | null>(null)
  const [progress, setProgress] = createSignal(0)

  createEffect(() => {
    const root = container()
    const bare = bar()
    if (!root || !bare) return

    const stop = scroll(
      (p) => {
        bare.style.width = `${p * 100}%`
        setProgress(p)
      },
      { container: root },
    )

    onCleanup(() => stop())
  })

  return (
    <div class="flex flex-col items-center gap-2">
      <div class="h-1 w-56 overflow-hidden rounded-full bg-card">
        <div ref={setBar} class="h-full bg-grad-rose" style={{ width: '0%' }} />
      </div>
      <span class="text-[10px] tabular-nums text-fg-dim">{(progress() * 100).toFixed(0)}%</span>
      <div
        ref={setContainer}
        class="h-56 w-56 overflow-y-scroll rounded-2xl border border-border bg-card"
      >
        <div class="space-y-3 p-4 text-xs leading-relaxed text-fg-muted">
          <For each={Array.from({ length: 18 })}>
            {(_, i) => <p>Scroll line {i() + 1}. The bar tracks progress imperatively.</p>}
          </For>
        </div>
      </div>
    </div>
  )
}
