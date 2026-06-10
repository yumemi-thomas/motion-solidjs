import type { Accessor, Setter } from 'solid-js'
import type { AnimationScope } from 'motion-dom'

/**
 * Scope handle shared by `createAnimate` and `createAnimateMini`: a Solid
 * accessor for the scope element that also satisfies motion's
 * `AnimationScope` contract (`current`) and tracks started animations so the
 * owner can stop them on dispose. `Controls` is the playback-controls type of
 * the animate function the scope is paired with.
 */
export type Scope<T extends Element, Controls> = Accessor<T | null> &
  AnimationScope<T | null> & {
    animations: Controls[]
    set: Setter<T | null>
  }

export function createAnimationScope<T extends Element, Controls>(
  element: Accessor<T | null>,
  setElement: Setter<T | null>,
): Scope<T, Controls> {
  const animations: Controls[] = []
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
