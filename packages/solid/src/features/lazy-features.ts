import type { BindingFactory } from '@/features/dom-animation'

/**
 * Global registry of binding factories provided by LazyMotion. Populated by
 * `updateLazyFeatures` and read by MotionState during mount.
 *
 * It's a module-level array (rather than context) because MotionState
 * instances exist below the LazyMotion provider in the Solid tree and need a
 * single source of truth that doesn't require re-rendering motion components
 * when the bundle changes.
 */
export const lazyFeatures: BindingFactory[] = []

/**
 * Append always-loaded factories to the registry, deduping on identity.
 * Called from `createMotionComponentWithFeatures` (motion namespace
 * creation) and from the `LazyMotion` features-prop effect.
 */
export function updateLazyFeatures(features: BindingFactory[]) {
  for (const feature of features) {
    if (feature && !lazyFeatures.includes(feature)) {
      lazyFeatures.push(feature)
    }
  }
}
