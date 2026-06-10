import type { Variants } from 'motion-dom'
import type { Options, VariantType } from '@/types'

// Solid-side variant resolver — VE-free replacement for motion-dom's
// `resolveVariant(visualElement, variant, custom)`.
//
// Caveat: dynamic-variant arguments are stubbed. motion-dom passes
// `(custom, latestValues, velocityProxy)` to a function variant; here we
// pass `(custom, {}, {})`. Variants of the form `(custom) => target` work;
// shapes that read current values resolve as if all current values are 0.
//
// Returns the raw variant object (preserving `transition` and `transitionEnd`
// keys). Callers needing only target keys destructure them off.

function valueIsDefined(value: unknown) {
  return value !== undefined && value !== null
}

/**
 * Resolve a definition to the VALUES it owns: target keys merged with
 * `transitionEnd` keys, with the `transition`/`transitionEnd` config props
 * themselves stripped. This is the one shape both the initial-paint path
 * (`resolveInitialValues`) and the style-ownership filter
 * (`cleanStylePropForMotionDom` via `targetDefinesKey`) reason about — keep
 * them on this resolver so they can't diverge: a style key inside
 * `transitionEnd` IS animation-owned, while a CSS `transition` style prop is
 * NOT, even though the raw variant object has a `transition` key.
 */
export function resolveDefinitionTarget(
  definition: Options['animate'] | undefined,
  variants: Variants | undefined,
  custom?: unknown,
) {
  const resolved = resolveVariant(definition, variants, custom)
  if (!resolved) return undefined
  const { transition, transitionEnd, ...target } = resolved
  return { ...target, ...transitionEnd }
}

/**
 * Whether an `initial`/`animate` definition owns `key`. Resolves variant
 * labels (and label arrays) against `variants` — so a value controlled by
 * e.g. `animate="active"` is recognised as owned by the animation and a
 * plain `style` value for the same key isn't applied over it.
 */
export function targetDefinesKey(
  target: Options['initial'],
  key: string,
  variants: Options['variants'],
  custom: unknown,
): boolean {
  if (!valueIsDefined(target) || typeof target === 'boolean') return false
  const resolved = resolveDefinitionTarget(target, variants, custom)
  return Boolean(resolved && valueIsDefined(resolved[key]))
}

function resolveVariant(
  definition: Options['animate'] | undefined,
  variants: Variants | undefined,
  custom?: unknown,
): VariantType | undefined {
  if (definition === undefined) return undefined
  if (Array.isArray(definition)) {
    let merged: VariantType | undefined
    for (const item of definition) {
      const resolved = resolveVariant(item, variants, custom)
      if (!resolved) continue
      merged = merged ? { ...merged, ...resolved } : { ...resolved }
    }
    return merged
  }
  if (typeof definition === 'object') return definition
  if (!variants) return undefined
  const variant = variants[definition]
  if (!variant) return undefined
  if (typeof variant === 'function') {
    // (custom, current, velocity) — current/velocity stubbed. See file header.
    const resolved = variant(custom, {}, {})
    if (typeof resolved === 'string') return resolveVariant(resolved, variants, custom)
    return resolved
  }
  if (typeof variant === 'string') return resolveVariant(variant, variants, custom)
  return variant
}
