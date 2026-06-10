import { getFeatureDefinitions, setFeatureDefinitions } from 'motion-dom'

import type { MotionHandle } from '@/core/create-motion'
import { setProjectionInit } from '@/core/projection-init'

/**
 * The registry shape `setFeatureDefinitions` accepts. motion-dom declares
 * the type but doesn't export it, so derive it from the setter's signature.
 */
export type FeatureDefinitions = Parameters<typeof setFeatureDefinitions>[0]

/**
 * One registry entry — every feature module exports its own so the
 * `isEnabled` gate and Feature class stay co-located with the feature, and
 * bundle files only list entries. motion-dom doesn't export the interface,
 * so derive it from the record type.
 */
export type FeatureDefinition = NonNullable<FeatureDefinitions[keyof FeatureDefinitions]>

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
