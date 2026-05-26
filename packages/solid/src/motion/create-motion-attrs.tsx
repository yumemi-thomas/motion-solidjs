import { motionInjectionKey } from '@/components/context'
import type { MotionProps } from '@/components/motion'
import type { createVisualElement } from '@/features/dom-animation'
import type { DefineComponent, Options } from '@/types'
import { isMotionValue } from 'motion-dom'
import type { JSX } from 'solid-js'
import { createMotion } from './create-motion'

// Motion prop-key allowlist. Lives here (not in `motion.tsx`) to break a
// runtime cycle: `motion.tsx` imports `createMotionAttrs` from this file.
// The compile-time exhaustiveness check below keeps it in sync with
// `MotionOptions`.

type MotionWrapperPropKey = 'forwardMotionProps' | 'ignoreStrict'
type ForwardedMotionPropKey = 'onFocus' | 'onBlur'

type MotionComponentPropKey =
  | Exclude<keyof Options, 'as' | 'layoutGroup' | 'motionConfig' | ForwardedMotionPropKey>
  | MotionWrapperPropKey

function exactMotionComponentPropKeys<const T extends readonly MotionComponentPropKey[]>(
  keys: T &
    (Exclude<MotionComponentPropKey, T[number]> extends never
      ? unknown
      : ['Missing motion props', Exclude<MotionComponentPropKey, T[number]>]) &
    (Exclude<T[number], MotionComponentPropKey> extends never
      ? unknown
      : ['Extra motion props', Exclude<T[number], MotionComponentPropKey>]),
) {
  return keys
}

export const motionComponentPropKeys = exactMotionComponentPropKeys([
  'ignoreStrict',
  'forwardMotionProps',
  'whileDrag',
  'whileHover',
  'whileTap',
  'whileInView',
  'whileFocus',
  'custom',
  'initial',
  'animate',
  'exit',
  'variants',
  'inherit',
  'style',
  'transformTemplate',
  'transition',
  'onAnimationStart',
  'onAnimationComplete',
  'onUpdate',
  'layout',
  'layoutId',
  'layoutScroll',
  'layoutRoot',
  'layoutAnchor',
  'data-framer-portal-id',
  'crossfade',
  'layoutDependency',
  'onBeforeLayoutMeasure',
  'onLayoutMeasure',
  'onLayoutAnimationStart',
  'onLayoutAnimationComplete',
  'globalTapTarget',
  'onTapStart',
  'onTap',
  'onTapCancel',
  'onHoverStart',
  'onHoverEnd',
  'viewport',
  'onViewportEnter',
  'onViewportLeave',
  'drag',
  'dragSnapToOrigin',
  'dragDirectionLock',
  'dragPropagation',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragTransition',
  'dragListener',
  'dragControls',
  // Framer's private MV-driven drag props. Without these in the
  // motion-prop allowlist they would survive `omitMotionProps` and be
  // forwarded to the DOM as `_dragx="[object Object]"`. The VE reads
  // them through `getProps()` (see VisualElementDragControls →
  // `getAxisMotionValue`), so keeping them out of the DOM attrs while
  // letting them flow into options is what makes the upstream
  // nested-page fixture work.
  '_dragX',
  '_dragY',
  'transformPagePoint',
  'onDragStart',
  'onDragEnd',
  'onDrag',
  'onDirectionLock',
  'onDragTransitionEnd',
  'onMeasureDragConstraints',
  'onPanSessionStart',
  'onPanStart',
  'onPan',
  'onPanEnd',
] as const)

type CreateMotionAttrsInput = MotionProps | (() => MotionProps)
type RefTarget = HTMLElement | SVGElement
type RefCallback<T> = (el: T) => void
type CreateMotionAttrsProps = JSX.HTMLAttributes<RefTarget> | MotionProps<any>
type ResolvedMotionAttrs = Record<string, unknown> & {
  ref: RefCallback<RefTarget>
}

export interface CreateMotionAttrsOptions {
  defaultAs?: MotionProps<any>['as']
  forwardMotionProps?: boolean
  renderer?: typeof createVisualElement
}

export type CreateMotionAttrsReturn = {
  (props?: CreateMotionAttrsProps): ResolvedMotionAttrs
  Provider: DefineComponent<{ children?: JSX.Element }>
}

function createReactiveMotionProps(input: CreateMotionAttrsInput): MotionProps {
  if (typeof input !== 'function') {
    return input
  }

  const target: MotionProps = {}
  const handler: ProxyHandler<MotionProps> = {
    get(_, key) {
      if (typeof key === 'symbol') return undefined
      return input()[key]
    },
    has(_, key) {
      return key in input()
    },
    ownKeys() {
      return Reflect.ownKeys(input())
    },
    getOwnPropertyDescriptor(_, key) {
      const props = input()
      if (!(key in props)) return undefined

      // Must carry a live accessor — Solid's `splitProps` reads via
      // `Object.getOwnPropertyDescriptors` then re-defines onto a clone, so
      // a descriptor without `get` flattens to `undefined`.
      return {
        configurable: true,
        enumerable: true,
        get() {
          return typeof key === 'symbol' ? undefined : input()[key]
        },
      }
    },
  }

  return new Proxy(target, handler)
}

function isRefCallback<T>(ref: unknown): ref is RefCallback<T> {
  return typeof ref === 'function'
}

function assignRef<T>(ref: unknown, value: T) {
  if (isRefCallback<T>(ref)) ref(value)
}

const createMotionAttrsPropKeys = [
  ...motionComponentPropKeys,
  'as',
  'children',
  'layoutGroup',
  'motionConfig',
] satisfies readonly PropertyKey[]

const createMotionAttrsPropKeySet = new Set<PropertyKey>(createMotionAttrsPropKeys)

function omitMotionProps(props: CreateMotionAttrsProps) {
  const domAttrs: Record<string, unknown> = {}

  for (const key in props) {
    if (!createMotionAttrsPropKeySet.has(key)) {
      const value = Reflect.get(props, key)
      // Unwrap MotionValues passed as direct attribute props (eg. SVG
      // `<motion.rect x={motionValue(50)} />`). Without this they would
      // serialize to `"[object Object]"` when Solid sets the attribute.
      // This matches motion-dom's handling of MV attribute props on SVG.
      domAttrs[key] = isMotionValue(value) ? value.get() : value
    }
  }

  return domAttrs
}

/**
 * Build a motion-aware attribute spreader for a Solid element. Splits motion
 * props from DOM attrs, registers the element with the motion lifecycle, and
 * returns a function that produces the final attrs (with merged styles, a
 * combined `ref`, and a `Provider` for nested motion context).
 *
 * @example
 * ```tsx
 * function FadeBox(props: { animate?: TargetAndTransition }) {
 *   const motionAttrs = createMotionAttrs(() => ({ ...props, initial: { opacity: 0 } }))
 *   return <div {...motionAttrs()} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Use the Provider to expose this node's motion state to children.
 * const motionAttrs = createMotionAttrs({ animate: 'visible', variants })
 * return (
 *   <motionAttrs.Provider>
 *     <div {...motionAttrs()}><Child /></div>
 *   </motionAttrs.Provider>
 * )
 * ```
 */
export function createMotionAttrs(
  input: CreateMotionAttrsInput,
  options: CreateMotionAttrsOptions = {},
): CreateMotionAttrsReturn {
  const inputProps = createReactiveMotionProps(input)
  const state = createMotion(inputProps, {
    defaultAs: options.defaultAs,
    renderer: options.renderer,
  })

  const motionAttrs = (props: CreateMotionAttrsProps = inputProps) => {
    const domAttrs = omitMotionProps(props)
    const motionProps = state.getProps()

    // Tap-style props need a focusable target for keyboard activation. Lives
    // in the initial-attrs path because the press feature (which would
    // otherwise set tabindex live) isn't loaded under SSR and skips jsdom
    // environments where motion-dom's `isHTMLElement` check fails.
    const userTabIndex = 'tabIndex' in props ? props.tabIndex : undefined
    const tapTriggered =
      motionProps.whileTap !== undefined ||
      motionProps.onTap !== undefined ||
      motionProps.onTapStart !== undefined
    const tabIndexInjection = userTabIndex === undefined && tapTriggered ? { tabindex: 0 } : {}

    return {
      ...domAttrs,
      ...(options.forwardMotionProps ? motionProps : {}),
      ...state.getAttrs(),
      ...tabIndexInjection,
      ref: (node: RefTarget) => {
        if ('ref' in props) assignRef(props.ref, node)
        state.setElement(node)
      },
    }
  }

  motionAttrs.Provider = (props: { children?: JSX.Element }) => (
    <motionInjectionKey.Provider value={state.state}>{props.children}</motionInjectionKey.Provider>
  )

  return motionAttrs
}
