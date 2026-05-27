import { createInView } from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'create-in-view',
  title: 'createInView',
  category: 'scroll',
  description:
    'A boolean accessor — flip any UI from the imperative IntersectionObserver primitive.',
  tag: 'createInView',
} as const

export default function UseInViewExample() {
  const [container, setContainer] = createSignal<HTMLDivElement | null>(null)
  const [target, setTarget] = createSignal<HTMLDivElement | null>(null)

  const view = createInView(target, () => ({
    root: container() ?? undefined,
    amount: 0.6,
  }))

  return (
    <div class="flex flex-col items-center gap-3">
      <div
        ref={setContainer}
        class="scrollbar-thin relative h-56 w-52 overflow-y-scroll rounded-2xl border border-border-strong bg-white shadow-soft"
      >
        <div class="flex h-72 items-end justify-center pb-3 font-mono text-[10px] text-fg-dim">
          ↓ keep scrolling
        </div>
        <div class="px-3">
          <div
            ref={setTarget}
            class="grid h-24 place-items-center rounded-xl text-xs font-semibold text-white shadow-glow transition-colors duration-300"
            classList={{
              'bg-grad-mint': view.isInView(),
              'bg-grad-rose': !view.isInView(),
            }}
          >
            {view.isInView() ? 'in view' : 'out of view'}
          </div>
        </div>
        <div class="flex h-72 items-start justify-center pt-3 font-mono text-[10px] text-fg-dim">
          ↑ keep scrolling
        </div>
      </div>
      <span class="rounded-full border border-border bg-white px-3 py-1 text-[10px] font-mono text-fg-dim">
        scroll to test
      </span>
    </div>
  )
}
