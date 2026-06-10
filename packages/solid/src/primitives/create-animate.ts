import { createSignal, onCleanup } from 'solid-js'
import type { AnimationPlaybackControls } from 'motion-dom'
import { createScopedAnimate } from 'motion'
import { createAnimationScope } from '@/primitives/animation-scope'
import type { Scope as AnimationScopeHandle } from '@/primitives/animation-scope'

type Scope<T extends Element> = AnimationScopeHandle<T, AnimationPlaybackControls>

/**
 * Returns a `[scope, animate]` tuple for imperatively animating elements
 * within a scoped DOM subtree. Animations started through `animate` are
 * tracked on the scope and stopped automatically when the owner disposes.
 *
 * @example
 * ```tsx
 * const [scope, animate] = createAnimate<HTMLDivElement>()
 *
 * return (
 *   <div ref={scope.set}>
 *     <button
 *       onClick={() => animate(scope.current!, { x: 100 }, { type: 'spring' })}
 *     >
 *       Slide
 *     </button>
 *   </div>
 * )
 * ```
 */
export function createAnimate<T extends Element = Element>(): [
  Scope<T>,
  ReturnType<typeof createScopedAnimate>,
] {
  const [element, setElement] = createSignal<T | null>(null)
  const scope = createAnimationScope<T, AnimationPlaybackControls>(element, setElement)

  const animate = createScopedAnimate({ scope })

  onCleanup(() => {
    scope.animations.forEach((animation) => animation.stop())
  })

  return [scope, animate]
}
