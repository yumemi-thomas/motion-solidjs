import { isForcedMotionValue, isMotionValue } from 'motion-dom'

import type { MotionProps } from '@/components/motion'
import type { MotionStyleProps } from '@/types'
import type { MotionHandle } from './create-motion'
import { resolveInitialValues } from './initial-values'
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
    if (
      hasTargetValue(motionProps.initial, motionKey) ||
      hasTargetValue(motionProps.animate, motionKey)
    ) {
      if (isMotionValue(value)) state.setStyleMotionValue(motionKey, value)
      continue
    }
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

  return buildSolidHTMLStyle(styleProps, transformTemplate) ?? {}
}

export function buildMotionAttrs(options: {
  attrs: Record<string, MotionStyleValue>
  motionProps: MotionHandle['options']
  props: MotionProps
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
    applyHTMLStyleValues(styleProps, styleProp, options.motionProps, options.state)
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
      (hasTargetValue(options.initial, motionKey) || hasTargetValue(options.animate, motionKey))
    ) {
      continue
    }
    cleanStyle ??= {}
    cleanStyle[motionKey] = style[key]
  }
  return cleanStyle
}
