import { createAnimateMini } from 'motion-solidjs'

export const meta = {
  slug: 'create-animate-mini',
  title: 'createAnimateMini',
  category: 'animations',
  description:
    'WAAPI-only sibling of createAnimate — smallest bundle for transform & opacity sequences.',
  tag: 'createAnimateMini',
} as const

export default function UseAnimateMiniExample() {
  const [scope, animate] = createAnimateMini<HTMLDivElement>()

  const run = async () => {
    await animate(scope.current!, { opacity: [1, 0.4, 1], scale: 1.3 }, { duration: 0.4 })
    await animate(
      scope.current!,
      { rotate: 180, borderRadius: '50%' },
      { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    )
    await animate(
      scope.current!,
      { rotate: 0, scale: 1, borderRadius: '20%' },
      { duration: 0.5, ease: 'easeOut' },
    )
  }

  return (
    <div class="flex flex-col items-center gap-3">
      <div ref={scope.set} class="h-20 w-20 rounded-[20%] bg-grad-amber shadow-glow" />
      <button
        onClick={run}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Run sequence
      </button>
    </div>
  )
}
