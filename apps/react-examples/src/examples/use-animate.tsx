import { useAnimate } from 'motion/react'

export const meta = {
  slug: 'use-animate',
  title: 'useAnimate',
  category: 'motion-values',
  description: 'Imperative animation — chain steps inside a click handler.',
  tag: 'imperative',
} as const

export default function UseAnimateExample() {
  const [scope, animate] = useAnimate<HTMLDivElement>()

  const run = async () => {
    await animate(scope.current!, { rotate: 360, scale: 1.4 }, { duration: 0.4 })
    await animate(
      scope.current!,
      { scale: 0.7, borderRadius: '50%' },
      { type: 'spring', stiffness: 320, damping: 14 },
    )
    await animate(
      scope.current!,
      { scale: 1, rotate: 0, borderRadius: '20%' },
      { type: 'spring', stiffness: 200, damping: 18 },
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={scope} className="h-20 w-20 rounded-[20%] bg-grad-rose shadow-glow" />
      <button
        onClick={run}
        className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Run sequence
      </button>
    </div>
  )
}
