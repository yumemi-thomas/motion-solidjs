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
  type MotionStyleValue,
} from './render-style'

function valueIsDefined(value: unknown) {
  return value !== undefined && value !== null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasTargetValue(target: unknown, key: string) {
  return isRecord(target) && valueIsDefined(target[key])
}

/**
 * Whether an `initial`/`animate` target defines `key`. Unlike `hasTargetValue`,
 * this resolves variant *labels* (and label arrays) against `variants` — so a
 * value controlled by e.g. `animate="active"` is recognised as owned by the
 * animation and a plain `style` value for the same key isn't applied over it.
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

function resolveAttrValues(attrs: Record<string, MotionStyleValue>) {
  const attrsProps: Record<string, unknown> = { ...attrs }
  Object.keys(attrs).forEach((key) => {
    attrsProps[key] = readMotionValue(attrs[key])
  })
  return attrsProps
}

function applyHTMLStyleValues(
  styleProps: MotionStyleProps,
  styleProp: MotionStyleProps,
  motionProps: MotionHandle['options'],
  state: MotionHandle,
  // Keys already provided by the resolved initial values (own OR inherited
  // variant). A plain `style` value must not override these — `initial` wins
  // for the first render; `style` is only a fallback for keys not in `initial`.
  resolvedInitialKeys: Set<string>,
) {
  let veEnsured = false
  for (const key in styleProp) {
    const value = styleProp[key]
    const motionKey = dashToCamel(key)
    const isForced = isForcedStyleMotionValue(motionKey, motionProps)
    // A style MV/forced value needs VE baseTarget tracking for removed-key
    // fallback animations such as whileFocus -> blur.
    if ((isMotionValue(value) || isForced) && !veEnsured) {
      state.ensureVisualElement()
      veEnsured = true
    }
    const inInitial = targetDefinesKey(
      motionProps.initial,
      motionKey,
      motionProps.variants,
      motionProps.custom,
    )
    const inAnimate = targetDefinesKey(
      motionProps.animate,
      motionKey,
      motionProps.variants,
      motionProps.custom,
    )
    if (isMotionValue(value) && (inInitial || inAnimate)) {
      state.setStyleMotionValue(motionKey, value)
      continue
    }
    // `initial` supplies the first-render value (and animation origin), so a
    // lower-priority plain `style` value for the same key is skipped. Likewise
    // `initial={false}` renders the resolved `animate` target (already in
    // currentValues) with no mount animation, so the style value mustn't
    // override it. But when only `animate` defines the key and `initial` is
    // absent, the style value IS the animation origin — render it so motion-dom
    // reads a real from-value and can accelerate (WAAPI), matching motion/react.
    // Later style updates are still protected via cleanStylePropForMotionDom.
    if (inInitial || (motionProps.initial === false && inAnimate)) continue
    // The resolved initial (incl. an inherited variant) already set this key;
    // don't let a plain style value clobber it.
    if (!isMotionValue(value) && resolvedInitialKeys.has(motionKey)) continue
    if (isForced && !isMotionValue(value) && state.visualElement) {
      styleProps[motionKey] = value
      continue
    }
    styleProps[key] = value
    if (isMotionValue(value)) {
      state.setStyleMotionValue(motionKey, value)
    } else if (state.getValueRegistry().has(motionKey)) {
      state.setStyleStaticValue(motionKey, value)
    } else if (state.visualElement) {
      state.visualElement.getValue(motionKey)?.jump(value, false)
    }
  }
}

function resolveStyleMotionValues(values: MotionStyleProps): MotionStyleProps {
  const resolved: MotionStyleProps = {}
  for (const key in values) {
    resolved[key] = readMotionValue(values[key])
  }
  return resolved
}

function addDragStyles(styleProps: MotionStyleProps, props: MotionProps) {
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
  styleProps: MotionStyleProps,
  transformTemplate: MotionProps['transformTemplate'],
  isSVG: boolean,
) {
  if (isSVG) {
    const kebab: Record<string, MotionStyleValue> = {}
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
  const kebab: MotionStyleProps = {}
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
  const styleProp = options.props.style || {}
  let styleProps: MotionStyleProps = isSVG ? { ...styleProp } : { ...currentValues }

  if (!isSVG) {
    // Snapshot the keys present from the resolved initial values (own or
    // inherited variant) before the style pass, so a plain `style` value can't
    // override an inherited-initial value.
    const resolvedInitialKeys = new Set(Object.keys(currentValues))
    applyHTMLStyleValues(
      styleProps,
      styleProp,
      options.motionProps,
      options.state,
      resolvedInitialKeys,
    )
  }

  styleProps = resolveStyleMotionValues(styleProps)

  if (isSVG) {
    // Keep raw user CSS (non-MotionValue, non-transform) in `style` rather than
    // letting motion-dom's buildSVGAttrs turn every non-transform value into an
    // SVG attribute (it does `state.attrs = state.style` for non-root SVG tags).
    // Mirrors framer-motion's copyRawValuesOnly: transform shortcuts (x/y/scale)
    // and MotionValues still route through buildSVGAttrs to become transform/attrs.
    const rawCss: MotionStyleProps = {}
    const svgInput: MotionStyleProps = { ...currentValues }
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
      if (isMotionValue(transformProp))
        options.state.setStyleMotionValue('transform', transformProp)
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
): MotionStyleProps | undefined {
  if (!style || typeof style !== 'object') return undefined

  let cleanStyle: MotionStyleProps | undefined
  for (const key in style) {
    const motionKey = key.startsWith('--') ? key : dashToCamel(key)
    if (
      !isMotionValue(style[key]) &&
      (targetDefinesKey(options.initial, motionKey, options.variants, options.custom) ||
        targetDefinesKey(options.animate, motionKey, options.variants, options.custom))
    ) {
      continue
    }
    cleanStyle ??= {}
    cleanStyle[motionKey] = style[key]
  }
  return cleanStyle
}
