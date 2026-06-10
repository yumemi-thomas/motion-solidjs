import { createEffect } from 'solid-js'

import { injectLazyMotionContext, type LazyMotionContext } from '@/components/lazy-motion/context'
import { installFeatureDefinitions } from '@/features/definitions'
import type { MotionHandle } from './create-motion'
import { installMotionMachinery } from './machinery'

export function createLazyMotionFeatureContext(): LazyMotionContext {
  return injectLazyMotionContext({
    features: () => ({}),
    strict: () => false,
  })
}

/**
 * Apply a LazyMotion-provided feature bundle to this handle: install the
 * machinery + feature definitions globally (upstream parity — LazyMotion
 * loads features into the global registry), late-init the VisualElement,
 * and run the feature pass.
 */
export function createLazyMotionFeatureWatcher(
  handle: MotionHandle,
  lazyMotionContext: LazyMotionContext,
) {
  createEffect(() => {
    const bundle = lazyMotionContext.features()
    if (!bundle.features && !bundle.renderer) return
    if (bundle.machinery) {
      installMotionMachinery(bundle.machinery)
    }
    if (bundle.features) {
      installFeatureDefinitions(bundle.features, bundle.projection)
    }
    if (bundle.renderer) {
      handle.initVisualElement(bundle.renderer)
    }
    handle.updateFeatures()
  })

  return lazyMotionContext
}
