import { isForcedMotionValue, isMotionValue, isVariantLabel } from 'motion-dom'
import type { ResolvedValues } from 'motion-dom'

import type { PresenceContext } from '@/components/animate-presence/presence'
import type { MotionStateContext, Options, VariantType } from '@/types'
import type { ResolvedOptions } from './motion-dom-props'
import { resolveDefinitionTarget } from './resolve-variant'

export type MotionOptionsWithPresence = ResolvedOptions & {
  presenceContext?: PresenceContext
}

export interface VariantContextParent {
  context: MotionStateContext
}

export function createVariantContext(
  getOptions: () => MotionOptionsWithPresence,
  getParent: () => VariantContextParent | undefined,
): MotionStateContext {
  return new Proxy<MotionStateContext>(
    {},
    {
      get(_target, prop: keyof MotionStateContext) {
        const options = getOptions()
        const value = options[prop]
        if (isVariantLabel(value) || (prop === 'initial' && value === false)) {
          return value
        }
        return getParent()?.context[prop]
      },
    },
  )
}

function resolveInitialVariant(
  definition?: Options['animate'],
  variants?: Options['variants'],
  custom?: Options['custom'],
  takeLast = false,
): VariantType | undefined {
  const merged = resolveDefinitionTarget(definition, variants, custom)
  if (!merged) return undefined
  // Collapse keyframe arrays to a single initial value — the first keyframe
  // normally, or the last when the initial animation is blocked (initial=false
  // / suppressed by Presence) so the element paints at the end-of-animation
  // state. Mirrors framer-motion's makeLatestValues.
  for (const key in merged) {
    const value = merged[key]
    if (Array.isArray(value)) {
      merged[key] = value[takeLast ? value.length - 1 : 0]
    }
  }
  return merged
}

/**
 * The `custom` value variant functions resolve against: the component's own
 * prop, falling back to AnimatePresence's.
 */
function resolveDefinitionCustom(options: MotionOptionsWithPresence): unknown {
  return options.custom ?? options.presenceContext?.custom
}

function resolveDefinitionValues(
  options: MotionOptionsWithPresence,
  context?: MotionStateContext,
): ResolvedValues {
  let initial =
    options.initial === undefined && options.variants ? context?.initial : options.initial
  if (options.presenceContext?.initial === false) {
    initial = false
  }
  const isInitialAnimationBlocked = initial === false
  const sources: Array<'initial' | 'animate'> = isInitialAnimationBlocked
    ? ['initial', 'animate']
    : ['initial']
  const custom = resolveDefinitionCustom(options)
  const resolved: ResolvedValues = {}
  for (const variant of sources) {
    const definition = options[variant] || context?.[variant]
    if (typeof definition === 'boolean') continue
    Object.assign(
      resolved,
      resolveInitialVariant(definition, options.variants, custom, isInitialAnimationBlocked),
    )
  }
  return resolved
}

// Mirrors react's makeLatestValues scrape pass: style MotionValue snapshots
// plus forced motion values (keys that layout/drag must own, e.g. transforms
// under `layout`) seed the latest values; variant-resolved values override.
function styleMotionValueSnapshot(options: MotionOptionsWithPresence): ResolvedValues {
  const style = options.style
  const styleSnapshot: ResolvedValues = {}
  if (style) {
    const layoutProps = { layout: options.layout, layoutId: options.layoutId }
    for (const key in style) {
      const value = style[key]
      if (isMotionValue(value)) {
        styleSnapshot[key] = value.get()
      } else if (
        isForcedMotionValue(key, layoutProps) &&
        (typeof value === 'string' || typeof value === 'number')
      ) {
        styleSnapshot[key] = value
      }
    }
  }
  return styleSnapshot
}

export function resolveInitialValues(
  options: MotionOptionsWithPresence,
  context?: MotionStateContext,
): ResolvedValues {
  return {
    ...styleMotionValueSnapshot(options),
    ...resolveDefinitionValues(options, context),
  }
}

/**
 * Current values of style MotionValues NOT owned by the initial/animate
 * resolution. Used when a feature bundle arrives after mount (LazyMotion):
 * the statically rendered MotionValues may have moved since the handle's
 * creation-time snapshot, so the VisualElement must seed from their current
 * values — while variant-resolved origins stay untouched (pre-install
 * renders painted them and the animation feature animates from them).
 */
export function resolveLateStyleMotionValues(
  options: MotionOptionsWithPresence,
  context?: MotionStateContext,
): ResolvedValues {
  const snapshot = styleMotionValueSnapshot(options)
  const owned = resolveDefinitionValues(options, context)
  for (const key in owned) {
    delete snapshot[key]
  }
  return snapshot
}
