import { createEffect } from 'solid-js'

import { injectLazyMotionContext, type LazyMotionContext } from '@/components/lazy-motion/context'
import type { BindingFactory } from '@/features/dom-animation'
import {
  checkLazyTriggers,
  lazyFeatures,
  updateLazyFeatureEntries,
  updateLazyFeatures,
} from '@/features/lazy-features'
import type { MotionHandle } from './create-motion'

export interface FeatureBindingController {
  update(): void
  dispose(): void
}

export function createFeatureBindingController(
  handle: MotionHandle,
  getOptions: () => MotionHandle['options'],
): FeatureBindingController {
  const bindings = new Map<BindingFactory, () => void>()

  const bindFactory = (factory: BindingFactory) => {
    if (bindings.has(factory)) return
    const cleanup = factory(handle, getOptions)
    if (cleanup) bindings.set(factory, cleanup)
  }

  return {
    update() {
      if (!handle.element) return
      for (const factory of lazyFeatures) bindFactory(factory)
      checkLazyTriggers(getOptions(), bindFactory)
    },
    dispose() {
      bindings.forEach((cleanup) => cleanup())
      bindings.clear()
    },
  }
}

export function createLazyMotionFeatureContext(): LazyMotionContext {
  return injectLazyMotionContext({
    features: () => ({}),
    strict: () => false,
  })
}

export function createLazyMotionFeatureWatcher(
  handle: MotionHandle,
  lazyMotionContext: LazyMotionContext,
) {
  createEffect(() => {
    const bundle = lazyMotionContext.features()
    if (!bundle.features?.length && !bundle.renderer && !bundle.lazyFeatures?.length) return
    if (bundle.features?.length) {
      updateLazyFeatures(bundle.features)
    }
    if (bundle.lazyFeatures?.length) {
      updateLazyFeatureEntries(bundle.lazyFeatures)
    }
    if (bundle.renderer) {
      handle.initVisualElement(bundle.renderer)
    }
    handle.updateFeatures()
  })

  return lazyMotionContext
}
