import {
  buildHTMLStyles,
  buildSVGAttrs,
  camelCaseAttributes,
  isMotionValue,
  isSVGTag,
} from 'motion-dom'
import type { HTMLRenderState, ResolvedValues, SVGRenderState } from 'motion-dom'

import type { MotionStyleProps } from '@/types'

export type MotionStyleValue = MotionStyleProps[string]

function isResolvedValue(value: MotionStyleValue): value is string | number {
  return typeof value === 'string' || typeof value === 'number'
}

function toResolvedValues(values: MotionStyleProps): ResolvedValues {
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

export function camelToDash(str: string) {
  return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`)
}

export function dashToCamel(str: string) {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

export function buildSolidHTMLStyle(latestValues: MotionStyleProps): MotionStyleProps | null {
  const state = createHTMLRenderState()
  buildHTMLStyles(state, toResolvedValues(latestValues))
  const result: MotionStyleProps = { ...state.style }
  for (const key in state.vars) {
    result[key] = state.vars[key]
  }
  return Object.keys(result).length === 0 ? null : result
}

export function buildSolidSVGAttrs(
  latestValues: MotionStyleProps,
  tag: string,
  styleProp?: MotionStyleProps,
): { attrs: Record<string, MotionStyleValue>; style: MotionStyleProps } {
  const state = createSVGRenderState()
  buildSVGAttrs(state, toResolvedValues(latestValues), isSVGTag(tag), undefined, styleProp)
  const attrs: Record<string, MotionStyleValue> = {}
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
