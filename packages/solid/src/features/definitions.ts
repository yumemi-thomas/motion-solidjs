import { getFeatureDefinitions, setFeatureDefinitions } from 'motion-dom'

import type { MotionHandle } from '@/motion/create-motion'
import { setProjectionInit } from '@/motion/projection-init'

/**
 * The registry shape `setFeatureDefinitions` accepts. motion-dom declares
 * the type but doesn't export it, so derive it from the setter's signature.
 */
export type FeatureDefinitions = Parameters<typeof setFeatureDefinitions>[0]

/**
 * Merge a bundle's feature definitions into motion-dom's global registry
 * (the upstream model: LazyMotion and eager namespaces both load features
 * globally; VisualElement.updateFeatures instantiates them per node when
 * `isEnabled(props)` matches). A bundle carrying layout/drag also installs
 * the per-VE projection initializer.
 */
export function installFeatureDefinitions(
  definitions: FeatureDefinitions,
  projection?: (handle: MotionHandle) => void,
): void {
  setFeatureDefinitions({ ...getFeatureDefinitions(), ...definitions })
  if (projection) setProjectionInit(projection)
}
