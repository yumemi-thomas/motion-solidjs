import { createAnimate, stagger } from 'motion-solidjs'
import { For } from 'solid-js'

export const meta = {
  slug: 'stagger-fn',
  title: 'stagger()',
  category: 'animations',
  description: 'Imperative stagger — pass stagger() to animate() to cascade selectors.',
  tag: 'imperative',
} as const

export default function StaggerFnExample() {
  const [scope, animate] = createAnimate<HTMLDivElement>()

  const play = async () => {
    await animate(
      '.dot',
      { y: -18, scale: 1.1 },
      { duration: 0.3, delay: stagger(0.06, { from: 'first' }) },
    )
    await animate(
      '.dot',
      { y: 0, scale: 1 },
      { type: 'spring', stiffness: 320, damping: 18, delay: stagger(0.04, { from: 'last' }) },
    )
  }

  return (
    <div class="flex flex-col items-center gap-4">
      <div ref={scope.set} class="grid grid-cols-4 gap-3 p-2">
        <For each={[0, 1, 2, 3, 4, 5, 6, 7]}>
          {(i) => (
            <div
              class="dot h-10 w-10 rounded-2xl bg-grad-mint shadow-glow"
              style={{ 'background-position': `${i * 14}%` }}
            />
          )}
        </For>
      </div>
      <button
        onClick={play}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Play
      </button>
    </div>
  )
}
