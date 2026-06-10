import {
  buildHTMLStyles,
  buildSVGAttrs,
  camelCaseAttributes,
  camelToDash,
  isMotionValue,
  isSVGTag,
} from 'motion-dom'
import type { HTMLRenderState, ResolvedValues, SVGRenderState } from 'motion-dom'

import type { MotionStyleProps, MotionStyleValue } from '@/types'
import type { MotionProps } from '@/components/motion'

export type { MotionStyleValue } from '@/types'

/**
 * Internal loose style bag. The public `MotionStyleProps` is strict
 * (kebab-case csstype + motion shorthands), but the style-building pipeline
 * mixes kebab-case input keys with motion-dom's camelCase keys, so internal
 * accumulators are plain string records.
 */
export type MotionStyleRecord = Record<string, MotionStyleValue>

function isResolvedValue(value: MotionStyleValue): value is string | number {
  return typeof value === 'string' || typeof value === 'number'
}

function toResolvedValues(values: MotionStyleRecord): ResolvedValues {
  const resolved: ResolvedValues = {}
  for (const key in values) {
    const value = readMotionValue(values[key])
    if (isResolvedValue(value)) resolved[key] = value
  }
  return resolved
}

function createHTMLRenderState(): HTMLRenderState {
  return {
    transform: {},
    transformOrigin: {},
    style: {},
    vars: {},
  }
}

function createSVGRenderState(): SVGRenderState {
  return {
    ...createHTMLRenderState(),
    attrs: {},
  }
}

export { camelToDash } from 'motion-dom'

// motion-dom exports camelToDash but not the inverse.
export function dashToCamel(str: string) {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

export function buildSolidHTMLStyle(
  latestValues: MotionStyleRecord,
  transformTemplate?: MotionProps['transformTemplate'],
): MotionStyleRecord | null {
  const state = createHTMLRenderState()
  buildHTMLStyles(state, toResolvedValues(latestValues), transformTemplate)
  const result: MotionStyleRecord = { ...state.style }
  for (const key in state.vars) {
    result[key] = state.vars[key]
  }
  return Object.keys(result).length === 0 ? null : result
}

export function buildSolidSVGAttrs(
  latestValues: MotionStyleRecord,
  tag: string,
  styleProp?: MotionStyleProps,
  transformTemplate?: MotionProps['transformTemplate'],
): { attrs: MotionStyleRecord; style: MotionStyleRecord } {
  const state = createSVGRenderState()
  buildSVGAttrs(state, toResolvedValues(latestValues), isSVGTag(tag), transformTemplate, styleProp)
  const attrs: MotionStyleRecord = {}
  for (const key in state.attrs) {
    const attrKey = camelCaseAttributes.has(key) ? key : camelToDash(key)
    attrs[attrKey] = state.attrs[key]
  }
  return {
    attrs,
    style: { ...state.style, ...state.vars },
  }
}

export function readMotionValue(value: MotionStyleValue): MotionStyleValue {
  return isMotionValue(value) ? value.get() : value
}
