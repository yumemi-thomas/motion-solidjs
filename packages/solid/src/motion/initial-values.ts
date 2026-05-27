import { isMotionValue, isVariantLabel } from 'motion-dom'
import type { ResolvedValues } from 'motion-dom'

import type { PresenceContext } from '@/components/animate-presence/presence'
import type { MotionStateContext, Options, VariantType } from '@/types'
import { resolveVariant } from './resolve-variant'

export type MotionOptionsWithPresence = Options & {
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
  const resolved = resolveVariant(definition, variants, custom)
  if (!resolved) return undefined
  const { transition, transitionEnd, ...target } = resolved
  const merged: Record<string, unknown> = { ...target, ...transitionEnd }
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
  return merged as VariantType
}

export function resolveInitialValues(
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
  const custom = options.custom ?? options.presenceContext?.custom
  const resolved: ResolvedValues = {}
  for (const variant of sources) {
    const definition = options[variant] || context?.[variant]
    if (typeof definition === 'boolean') continue
    Object.assign(
      resolved,
      resolveInitialVariant(definition, options.variants, custom, isInitialAnimationBlocked),
    )
  }

  const styleSnapshot: ResolvedValues = {}
  const style = options.style
  if (style) {
    for (const key in style) {
      const value = style[key]
      if (isMotionValue(value)) {
        styleSnapshot[key] = value.get()
      }
    }
  }
  return { ...styleSnapshot, ...resolved }
}
