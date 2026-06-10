import type { animate } from 'motion'
import type { MotionValue } from 'motion-dom'
import type {
  DOMKeyframesDefinition,
  MotionNodeOptions,
  ResolvedValues,
  SVGPathProperties,
  TargetAndTransition,
  TransformProperties,
  VariantLabels,
  Variants,
} from 'motion-dom'
import type { TransformPoint } from 'motion-utils'
import type { Accessor, Component, JSX } from 'solid-js'

import type { LayoutGroupState } from '@/components/context'
import type { MotionConfigState } from '@/components/motion-config/types'
import type { DragProps } from '@/features/gestures/drag/types'
import type { FocusProps } from '@/features/gestures/focus'
import type { HoverProps } from '@/features/gestures/hover'
import type { InViewProps } from '@/features/gestures/in-view'
import type { PressProps } from '@/features/gestures/press'
import type { PanProps } from '@/features/gestures/pan'
import type { LayoutOptions } from '@/features/layout/types'

// ===========================================================================
// Solid-flavoured runtime + type helpers
// ===========================================================================

export type MaybeAccessor<T> = T | Accessor<T>
export type MaybeElementAccessor<T extends Element = Element> = MaybeAccessor<T | null | undefined>
export type DefineComponent<P = any> = Component<P> & { name?: string }

export function resolveAccessor<T>(value: MaybeAccessor<T>): T {
  return isAccessor(value) ? value() : value
}

export function isAccessor<T>(value: MaybeAccessor<T>): value is Accessor<T> {
  return typeof value === 'function'
}

export function resolveElement<T extends Element>(value: MaybeElementAccessor<T>): T | undefined {
  return resolveAccessor(value) ?? undefined
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

// ===========================================================================
// Common helper types
// ===========================================================================

export type ComponentProps<T> = T extends DefineComponent<infer Props> ? Props : never

export type ElementType = keyof JSX.IntrinsicElements
export type AsTag = keyof JSX.IntrinsicElements | ({} & string) | Component

export type ToRefs<T> = {
  [K in keyof T]: MaybeAccessor<T[K]>
}

// ===========================================================================
// Motion-flavoured shared types
// ===========================================================================

export type SupportedEdgeUnit = 'px' | 'vw' | 'vh' | '%'

export type EdgeUnit = `${number}${SupportedEdgeUnit}`

export type NamedEdges = 'start' | 'end' | 'center'

export type EdgeString = NamedEdges | EdgeUnit | `${number}`

export type Edge = EdgeString | number

export type ProgressIntersection = [number, number]

export type Intersection = `${Edge} ${Edge}`

export interface ScrollInfoOptions {
  container?: HTMLElement
  target?: Element
  axis?: 'x' | 'y'
  offset?: Array<Edge | Intersection | ProgressIntersection>
  /**
   * When true, enables per-frame checking of scrollWidth/scrollHeight
   * to detect content size changes and recalculate scroll progress.
   * @default false
   */
  trackContentSize?: boolean
}

export type $Transition = MotionNodeOptions['transition']

// ===========================================================================
// MotionValue / SVG attribute machinery
// ===========================================================================

type SVGElementTag =
  | 'svg'
  | 'animate'
  | 'animateMotion'
  | 'animateTransform'
  | 'circle'
  | 'clipPath'
  | 'defs'
  | 'desc'
  | 'ellipse'
  | 'feBlend'
  | 'feColorMatrix'
  | 'feComponentTransfer'
  | 'feComposite'
  | 'feConvolveMatrix'
  | 'feDiffuseLighting'
  | 'feDisplacementMap'
  | 'feDistantLight'
  | 'feDropShadow'
  | 'feFlood'
  | 'feFuncA'
  | 'feFuncB'
  | 'feFuncG'
  | 'feFuncR'
  | 'feGaussianBlur'
  | 'feImage'
  | 'feMerge'
  | 'feMergeNode'
  | 'feMorphology'
  | 'feOffset'
  | 'fePointLight'
  | 'feSpecularLighting'
  | 'feSpotLight'
  | 'feTile'
  | 'feTurbulence'
  | 'filter'
  | 'foreignObject'
  | 'g'
  | 'image'
  | 'line'
  | 'linearGradient'
  | 'marker'
  | 'mask'
  | 'metadata'
  | 'mpath'
  | 'path'
  | 'pattern'
  | 'polygon'
  | 'polyline'
  | 'radialGradient'
  | 'rect'
  | 'stop'
  | 'switch'
  | 'symbol'
  | 'text'
  | 'textPath'
  | 'tspan'
  | 'use'
  | 'view'

type SVGAttributesWithoutMotionProps<K extends keyof JSX.IntrinsicElements> = Pick<
  JSX.IntrinsicElements[K],
  Exclude<keyof JSX.IntrinsicElements[K], keyof Options | keyof JSX.AriaAttributes>
>

/**
 * @public
 */
export interface CustomValueType {
  mix: (from: any, to: any) => (p: number) => number | string
  toValue: () => number | string
}

export type MakeCustomValueType<T> = { [K in keyof T]: T[K] | CustomValueType }

export type MakeMotion<T> = MakeCustomValueType<{
  [K in keyof T]: T[K] | MotionValue<number> | MotionValue<string> | MotionValue<any>
}>

/**
 * Blanket-accept any SVG attribute as a `MotionValue`
 * @public
 */
export type SVGAttributesAsMotionValues<K extends keyof JSX.IntrinsicElements> = MakeMotion<
  SVGAttributesWithoutMotionProps<K>
>

export type SVGAttributesWithMotionValues = {
  [K in SVGElementTag]: SVGAttributesAsMotionValues<K>
}

export type SetMotionValueType<T, Keys extends keyof T> = {
  [K in keyof T]: K extends Keys
    ? K extends keyof JSX.IntrinsicElements
      ? SVGAttributesAsMotionValues<K>
      : T[K]
    : T[K]
}

type IntrinsicElementAttributesAsMotionValues = SetMotionValueType<
  JSX.IntrinsicElements,
  keyof SVGAttributesWithMotionValues
>

// `children` is omitted here so the wider `MotionProps.children`
// (`JSX.Element | MotionValue<number> | MotionValue<string>`) survives the
// intersection in `MotionNameSpace` instead of being collapsed to just
// `JSX.Element` by `JSX.IntrinsicElements[C]`. Mirrors framer-motion's
// `MotionProps.children = React.ReactNode | MotionValueNumber | MotionValueString`.
export type MotionHTMLAttributes<C extends ElementType> = Omit<
  IntrinsicElementAttributesAsMotionValues[C],
  keyof Options | 'style' | 'as' | 'children'
>

// ===========================================================================
// Core motion options + variant types
// ===========================================================================

type AnimationPlaybackControls = ReturnType<typeof animate>

export interface VariantType extends TargetAndTransition {
  transition?: Options['transition']
  attrX?: DOMKeyframesDefinition['x']
  attrY?: DOMKeyframesDefinition['y']
  attrScale?: DOMKeyframesDefinition['scale']
}

interface BoundingBox {
  top: number
  right: number
  bottom: number
  left: number
}

export interface DragOptions {
  constraints?: false | Partial<BoundingBox>
  dragSnapToOrigin?: boolean | 'x' | 'y'
}

export type MotionStyleValue = string | number | undefined | MotionValue

/**
 * Motion-specific style shorthands: transform values (x, y, scale, rotate, …)
 * and SVG path properties (pathLength, …). These are motion API keys rather
 * than real CSS properties, so they stay camelCase and accept any animatable
 * value.
 */
type MotionStyleShorthandKey = keyof TransformProperties | keyof SVGPathProperties

/**
 * Solid-faithful `style` prop: kebab-case CSS properties (Solid's
 * csstype-based `JSX.CSSProperties`, including `--*` custom properties) plus
 * motion's transform / SVG-path shorthands. Every value may also be a
 * `MotionValue`. Unlike motion/react's camelCase `MotionStyle`, camelCase CSS
 * keys (`backgroundColor`) and unknown properties are rejected.
 */
export type MotionStyleProps = {
  [K in MotionStyleShorthandKey]?: MotionStyleValue
} & {
  [K in Exclude<keyof JSX.CSSProperties, MotionStyleShorthandKey>]?:
    | JSX.CSSProperties[K]
    | MotionValue
}

export interface Options<T = any>
  extends LayoutOptions, PressProps, HoverProps, InViewProps, DragProps, PanProps, FocusProps {
  custom?: T
  as?: AsTag
  initial?: VariantLabels | VariantType | boolean
  animate?: VariantLabels | VariantType
  exit?: VariantLabels | VariantType
  variants?: Variants
  inherit?: boolean
  style?: MotionStyleProps
  transformTemplate?: (transform: TransformProperties, generatedTransform: string) => string
  transition?: $Transition & {
    layout?: $Transition
  }
  layoutGroup?: LayoutGroupState
  motionConfig?: MotionConfigState
  /**
   * Map a page-relative pointer point to the coordinate space pan/drag
   * gestures should operate in. Plumbed onto motion-dom's VisualElement
   * props so `getTransformPagePoint()` returns it; usually injected from
   * `<MotionConfig transformPagePoint={...}>`.
   */
  transformPagePoint?: TransformPoint
  /**
   * Pass MotionValues here to drive them directly from the drag gesture
   * (rather than the element's own x/y). Matches framer-motion's
   * private `_dragX` / `_dragY` props on `MotionNodeDragHandlers`.
   */
  _dragX?: MotionValue<number>
  _dragY?: MotionValue<number>
  onAnimationComplete?: (definition: Options['animate']) => void
  onUpdate?: (latest: ResolvedValues) => void
  onAnimationStart?: (definition: Options['animate']) => void
}

export interface MotionStateContext {
  initial?: VariantLabels | boolean
  animate?: VariantLabels
  whileInView?: VariantLabels
  whileTap?: VariantLabels
  whileHover?: VariantLabels
  whileFocus?: VariantLabels
  whileDrag?: VariantLabels
  exit?: VariantLabels
}

export type AnimationFactory = () => AnimationPlaybackControls | undefined
