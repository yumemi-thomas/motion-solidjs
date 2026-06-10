import { isForcedMotionValue, isMotionValue } from 'motion-dom'

import type { MotionProps } from '@/components/motion'
import type { MotionStyleProps, Options } from '@/types'
import type { MotionHandle } from './create-motion'
import { resolveInitialValues } from './initial-values'
import { resolveVariant } from './resolve-variant'
import {
  buildSolidHTMLStyle,
  buildSolidSVGAttrs,
  camelToDash,
  dashToCamel,
  readMotionValue,
  type MotionStyleRecord,
  type MotionStyleValue,
} from './render-style'

function valueIsDefined(value: unknown) {
  return value !== undefined && value !== null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Whether an `initial`/`animate` target defines `key`. This resolves variant
 * *labels* (and label arrays) against `variants` — so a value controlled by
 * e.g. `animate="active"` is recognised as owned by the animation and a plain
 * `style` value for the same key isn't applied over it.
 */
function targetDefinesKey(
  target: Options['initial'],
  key: string,
  variants: Options['variants'],
  custom: unknown,
) {
  if (!valueIsDefined(target) || typeof target === 'boolean') return false
  if (isRecord(target)) return valueIsDefined(target[key])
  const resolved = resolveVariant(target, variants, custom)
  return Boolean(resolved && key in resolved && valueIsDefined(resolved[key]))
}

function getTagName(tag: MotionProps<any>['as']) {
  return typeof tag === 'string' ? tag : 'div'
}

function isForcedStyleMotionValue(
  key: string,
  options: Pick<MotionHandle['options'], 'layout' | 'layoutId'>,
) {
  return isForcedMotionValue(key, options)
}

function resolveAttrValues(attrs: MotionStyleRecord) {
  const attrsProps: Record<string, unknown> = { ...attrs }
  Object.keys(attrs).forEach((key) => {
    attrsProps[key] = readMotionValue(attrs[key])
  })
  return attrsProps
}

/**
 * Mirror of framer-motion's `copyRawValuesOnly`: copy plain CSS values into
 * `base`, leaving MotionValues and forced motion values to render from
 * `latestValues` (which the caller spreads OVER `base`, so any key motion
 * owns — initial/animate-resolved, MV snapshots, animated values — wins by
 * ordering, exactly like react's `{...rawStatics, ...builtFromLatestValues}`).
 *
 * Side effects per style entry: MVs register with the VisualElement (its
 * `addValue` seeds `latestValues` from the MV and binds it to the render
 * loop), and MV/forced values ensure the VE exists so baseTarget tracking
 * covers removed-key fallbacks such as whileFocus -> blur.
 */
function applyHTMLStyleValues(
  base: MotionStyleRecord,
  styleProp: MotionStyleRecord,
  motionProps: MotionHandle['options'],
  state: MotionHandle,
) {
  for (const key in styleProp) {
    const value = styleProp[key]
    const motionKey = dashToCamel(key)
    if (isMotionValue(value)) {
      // The VE self-registers style MotionValues: its constructor and every
      // `update()` scrape them from props (`scrapeMotionValuesFromProps`).
      // Without a feature bundle there is no renderer, the VE stays
      // unconstructed and the MV renders its current value statically —
      // motion/react parity; the tracked machinery read in `getAttrs`
      // re-runs this computation on install.
      state.ensureVisualElement()
    } else if (isForcedStyleMotionValue(motionKey, motionProps)) {
      // Forced statics render from latestValues (the creation snapshot
      // scrapes them, mirroring react's makeLatestValues; the VE's update
      // scrape tracks later changes) — they just need the VE to exist for
      // baseTarget tracking.
      state.ensureVisualElement()
    } else {
      base[key] = value
    }
  }
}

function resolveStyleMotionValues(values: MotionStyleRecord): MotionStyleRecord {
  const resolved: MotionStyleRecord = {}
  for (const key in values) {
    resolved[key] = readMotionValue(values[key])
  }
  return resolved
}

function addDragStyles(styleProps: MotionStyleRecord, props: MotionProps) {
  if (props.drag && props.dragListener !== false) {
    Object.assign(styleProps, {
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      touchAction: props.drag === true ? 'none' : `pan-${props.drag === 'x' ? 'y' : 'x'}`,
    })
  }
}

function buildFinalStyle(
  styleProps: MotionStyleRecord,
  transformTemplate: MotionProps['transformTemplate'],
  isSVG: boolean,
) {
  if (isSVG) {
    const kebab: MotionStyleRecord = {}
    for (const key in styleProps) {
      kebab[camelToDash(key)] = styleProps[key]
    }
    return kebab
  }

  const built = buildSolidHTMLStyle(styleProps, transformTemplate)
  if (!built) return {}
  // motion-dom's buildHTMLStyles emits camelCase keys (React accepts those on a
  // style object). Solid's runtime applies a spread `style` object via
  // `style.setProperty(key, value)`, which is a no-op for camelCase names — so
  // multi-word props (backgroundColor, borderRadius, …) would silently vanish.
  // Convert to kebab-case (leaving custom properties and already-kebab keys
  // untouched) so the static-style path matches the animated-style path.
  const kebab: MotionStyleRecord = {}
  for (const key in built) {
    kebab[key.startsWith('--') ? key : camelToDash(key)] = built[key]
  }
  return kebab
}

export function buildMotionAttrs(options: {
  attrs: Record<string, MotionStyleValue>
  motionProps: MotionHandle['options']
  // `transform` is a top-level SVG attribute, not on the base MotionProps surface.
  props: MotionProps & { transform?: MotionStyleValue }
  state: MotionHandle
}) {
  const isSVG = options.state.type === 'svg'
  const attrsProps = resolveAttrValues(options.attrs)
  const currentValues = options.motionProps.motionConfig?.isStatic
    ? resolveInitialValues(options.motionProps, options.state.context)
    : options.state.visualElement?.latestValues || options.state.latestValues
  // The public style prop is strictly typed (kebab-case csstype); internally
  // the pipeline mixes kebab and camelCase keys, so widen to a string record.
  const styleProp: MotionStyleRecord = options.props.style ?? {}
  let styleProps: MotionStyleRecord

  if (isSVG) {
    styleProps = { ...styleProp }
  } else {
    const base: MotionStyleRecord = {}
    applyHTMLStyleValues(base, styleProp, options.motionProps, options.state)
    styleProps = { ...base, ...currentValues }
  }

  styleProps = resolveStyleMotionValues(styleProps)

  if (isSVG) {
    // Keep raw user CSS (non-MotionValue, non-transform) in `style` rather than
    // letting motion-dom's buildSVGAttrs turn every non-transform value into an
    // SVG attribute (it does `state.attrs = state.style` for non-root SVG tags).
    // Mirrors framer-motion's copyRawValuesOnly: transform shortcuts (x/y/scale)
    // and MotionValues still route through buildSVGAttrs to become transform/attrs.
    const rawCss: MotionStyleRecord = {}
    const svgInput: MotionStyleRecord = { ...currentValues }
    for (const key in styleProps) {
      const isRawCss =
        !isMotionValue(styleProp[key]) &&
        !isForcedStyleMotionValue(dashToCamel(key), options.motionProps)
      if (isRawCss) rawCss[key] = styleProps[key]
      else svgInput[key] = styleProps[key]
    }
    // Scrape a `transform` prop (MotionValue or string) into the SVG values so
    // motion-dom's buildSVGAttrs routes it to `style.transform` (+ transform-
    // origin / transform-box) rather than leaving it as a raw `transform`
    // attribute. Mirrors motion/react's scrapeMotionValuesFromProps → buildSVGAttrs.
    const transformProp = options.props.transform
    if (transformProp !== undefined && svgInput.transform === undefined) {
      svgInput.transform = isMotionValue(transformProp) ? transformProp.get() : transformProp
      // The SVG VE self-registers MotionValue props (incl. `transform`) via
      // its scrapeMotionValuesFromProps; it just needs to exist.
      if (isMotionValue(transformProp)) options.state.ensureVisualElement()
    }
    const { attrs: svgAttrs, style: svgStyle } = buildSolidSVGAttrs(
      svgInput,
      getTagName(options.state.options.as),
      options.props.style,
      options.motionProps.transformTemplate,
    )
    Object.assign(attrsProps, svgAttrs)
    styleProps = { ...rawCss, ...svgStyle }
  }

  addDragStyles(styleProps, options.props)
  attrsProps.style = buildFinalStyle(styleProps, options.motionProps.transformTemplate, isSVG)
  return attrsProps
}

export function cleanStylePropForMotionDom(
  style: MotionStyleProps | undefined,
  options: MotionProps,
): MotionStyleRecord | undefined {
  if (!style || typeof style !== 'object') return undefined

  const styleRecord: MotionStyleRecord = style
  let cleanStyle: MotionStyleRecord | undefined
  for (const key in styleRecord) {
    const motionKey = key.startsWith('--') ? key : dashToCamel(key)
    const forcedByLayout =
      (options.layout || options.layoutId !== undefined) &&
      isForcedStyleMotionValue(motionKey, options)
    if (
      !isMotionValue(styleRecord[key]) &&
      // Layout-forced values (scale-corrected keys and opacity under
      // layout/layoutId) stay in motion-dom's style — react passes them
      // through raw, and the latest-values scrape needs them as the
      // pre-animation paint/origin. Plain transforms stay filtered when
      // owned by initial/animate so a style update can't fight the
      // animation (transforms are "forced" unconditionally upstream).
      !forcedByLayout &&
      (targetDefinesKey(options.initial, motionKey, options.variants, options.custom) ||
        targetDefinesKey(options.animate, motionKey, options.variants, options.custom))
    ) {
      continue
    }
    cleanStyle ??= {}
    cleanStyle[motionKey] = styleRecord[key]
  }
  return cleanStyle
}
