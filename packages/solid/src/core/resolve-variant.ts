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

export function resolveVariant(
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
