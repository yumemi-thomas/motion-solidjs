import { createSignal, onCleanup } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
import type { AnimationPlaybackControls, AnimationScope } from 'motion-dom'
import { createScopedAnimate } from 'motion'

type Scope<T extends Element> = Accessor<T | null> &
  AnimationScope<T | null> & {
    animations: AnimationPlaybackControls[]
    set: Setter<T | null>
  }

function createScope<T extends Element>(
  element: Accessor<T | null>,
  setElement: Setter<T | null>,
): Scope<T> {
  const animations: AnimationPlaybackControls[] = []
  const scope = Object.assign(element, {
    animations,
    current: null,
    set: setElement,
  })

  Object.defineProperty(scope, 'current', {
    get: () => element(),
    set: (value: T | null) => setElement(() => value),
  })

  return scope
}

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
  const scope = createScope(element, setElement)

  const animate = createScopedAnimate({ scope })

  onCleanup(() => {
    scope.animations.forEach((animation) => animation.stop())
  })

  return [scope, animate]
}
