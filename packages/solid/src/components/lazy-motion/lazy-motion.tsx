import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { lazyMotionInjectionKey } from './context'
import type { FeatureBundle } from '@/features/dom-animation'

type FeaturesProp = FeatureBundle | Promise<FeatureBundle> | (() => Promise<FeatureBundle>)

export interface LazyMotionProps {
  children?: JSX.Element
  features: FeaturesProp
  strict?: boolean
}

/**
 * Defers loading of motion features so they can be code-split. Pass either a
 * sync `FeatureBundle`, a `Promise<FeatureBundle>`, or a thunk returning one
 * (e.g. a dynamic `import()`).
 *
 * @example
 * ```tsx
 * <LazyMotion features={() => import('motion-solidjs/features').then(r => r.domAnimation)}>
 *   <motion.div animate={{ x: 100 }} />
 * </LazyMotion>
 * ```
 */
export function LazyMotion(props: LazyMotionProps) {
  const [features, setFeatures] = createSignal<Partial<FeatureBundle>>({})
  const strict = createMemo(() => props.strict ?? false)

  createEffect(() => {
    const nextFeatures = props.features

    if (typeof nextFeatures === 'object' && 'renderer' in nextFeatures) {
      setFeatures(nextFeatures)
    } else if (typeof nextFeatures === 'function') {
      nextFeatures().then((mod) => {
        setFeatures(mod)
      })
    } else if (nextFeatures instanceof Promise) {
      nextFeatures.then((mod) => {
        setFeatures(mod)
      })
    }
  })

  return (
    <lazyMotionInjectionKey.Provider
      value={{
        features,
        strict,
      }}
    >
      {props.children}
    </lazyMotionInjectionKey.Provider>
  )
}
