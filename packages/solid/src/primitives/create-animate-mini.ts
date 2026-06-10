import { createSignal, onCleanup } from 'solid-js'
// `motion/mini` is the WAAPI-only DOM bundle — importing from here keeps
// the JS animation engine / spring / keyframes-resolver out of consumer
// bundles that only need CSS-animatable properties.
import { animate as animateMini } from 'motion/mini'
import { createAnimationScope } from '@/primitives/animation-scope'
import type { Scope as AnimationScopeHandle } from '@/primitives/animation-scope'

type Scope<T extends Element> = AnimationScopeHandle<T, MiniAnimationPlaybackControls>

type MiniAnimationPlaybackControls = ReturnType<typeof animateMini>

type AnimationOptions = Parameters<typeof animateMini>[2]
type AnimationKeyframes = Parameters<typeof animateMini>[1]

/**
 * Mini variant of `createAnimate` — uses motion-react's WAAPI-only `animate`
 * primitive instead of the full hybrid `createScopedAnimate`. Returns
 * `[scope, animate]` with the same shape as `createAnimate`.
 *
 * Smaller bundle: ships only WAAPI + keyframe normalization, no JS-side
 * animation engine, no spring physics, no color/string interpolation.
 *
 * **Use this when** the consumer's animations are limited to CSS-animatable
 * properties (numeric values, simple keyframes, standard easing). The WAAPI
 * runtime handles those natively in the browser.
 *
 * **Don't use this when** the consumer needs:
 *   - Spring physics (`transition: { type: 'spring', stiffness, damping }`)
 *   - Color interpolation (`color: 'red' -> 'blue'`)
 *   - Complex string keyframes (`boxShadow`, `filter`)
 *   - Non-numeric value interpolation
 *
 * Mirrors motion-react's `useAnimate` from `framer-motion/mini` — the API
 * surface is the same, just with WAAPI-only semantics under the hood.
 *
 * @example
 * ```tsx
 * const [scope, animate] = createAnimateMini<HTMLDivElement>()
 *
 * return (
 *   <div ref={scope.set}>
 *     <button onClick={() => animate(scope.current!, { opacity: 0.5 })}>
 *       Fade
 *     </button>
 *   </div>
 * )
 * ```
 */
export function createAnimateMini<T extends Element = Element>(): [
  Scope<T>,
  (
    elementOrSelector: Element | Element[] | NodeListOf<Element> | string,
    keyframes: AnimationKeyframes,
    options?: AnimationOptions,
  ) => MiniAnimationPlaybackControls,
] {
  const [element, setElement] = createSignal<T | null>(null)
  const scope = createAnimationScope<T, MiniAnimationPlaybackControls>(element, setElement)

  // motion/mini doesn't expose a `createScopedWaapiAnimate` factory, so
  // resolve string selectors against the scope element manually before
  // delegating to the unscoped `animateMini`.
  const scopedAnimate = (
    elementOrSelector: Element | Element[] | NodeListOf<Element> | string,
    keyframes: AnimationKeyframes,
    options?: AnimationOptions,
  ): MiniAnimationPlaybackControls => {
    let target: Element | Element[] | NodeListOf<Element>
    if (typeof elementOrSelector === 'string') {
      target = scope.current
        ? scope.current.querySelectorAll(elementOrSelector)
        : document.querySelectorAll(elementOrSelector)
    } else {
      target = elementOrSelector
    }
    const controls = animateMini(target, keyframes, options)
    scope.animations.push(controls)
    return controls
  }

  onCleanup(() => {
    scope.animations.forEach((animation) => animation.stop())
    scope.animations.length = 0
  })

  return [scope, scopedAnimate]
}
