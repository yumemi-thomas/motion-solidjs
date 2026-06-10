import { Dynamic } from 'solid-js/web'
import { children, createMemo, Show, untrack, type JSX } from 'solid-js'
import { isMotionValue, type MotionValue } from 'motion-dom'
import type { FeatureBundle } from '@/features/dom-animation'
import type { createVisualElement } from '@/features/dom-animation'
import { installFeatureDefinitions } from '@/features/definitions'
import { installMotionMachinery } from '@/motion/machinery'
import { createMotionAttrs } from '@/motion/create-motion-attrs'
import { useMotionValueChild } from '@/motion/use-motion-value-child'
import type { AsTag, ComponentProps, DefineComponent, MotionHTMLAttributes, Options } from '@/types'

type MotionChild = JSX.Element | MotionValue<number> | MotionValue<string>

/**
 * Narrow to the MotionValue variants we accept as a child. motion-dom's
 * exported `isMotionValue` widens to `MotionValue<any>`, while
 * `useMotionValueChild` only needs numeric/string MotionValues.
 */
const isMotionValueChild = (
  el: MotionChild | undefined,
): el is MotionValue<number> | MotionValue<string> => isMotionValue(el)

/**
 * Render motion children with motion-react parity:
 * - MotionValue child → subscribe via `useMotionValueChild` and render live
 * - Anything else → pass through reactively
 *
 * Isolated into its own component so the `children` access happens once,
 * inside this child's scope. Reading `props.children` twice in the parent
 * would re-evaluate the JSX expression twice (creating two sets of nodes)
 * — that breaks lifecycle-sensitive children like `<Reorder.Item>`.
 */
function MotionChildren(props: { children?: MotionChild }) {
  const resolved = children(() => props.children as JSX.Element)
  const motionValueChild = createMemo(() => {
    const child = resolved()
    return isMotionValueChild(child) ? child : undefined
  })
  const renderedChild = createMemo(() => {
    const child = resolved()
    return isMotionValueChild(child) ? undefined : child
  })

  return (
    <Show keyed when={motionValueChild()} fallback={renderedChild()}>
      {(child) => {
        const latest = useMotionValueChild(child)
        return <>{latest()}</>
      }}
    </Show>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MotionProps<T extends AsTag = 'div', K = unknown> extends Omit<
  Options<K>,
  'motionConfig' | 'layoutGroup'
> {
  as?: T
  // Mirrors motion-react's `MotionProps.children`: numeric/string MotionValues
  // can be passed as a sole child and are subscribed to live via
  // `useMotionValueChild` (see MotionChildren below).
  children?: JSX.Element | MotionValue<number> | MotionValue<string>
  whileDrag?: Options['whileDrag']
  whileHover?: Options['whileHover']
  whileTap?: Options['whileTap']
  whileInView?: Options['whileInView']
  whileFocus?: Options['whileFocus']
  forwardMotionProps?: boolean
  ignoreStrict?: boolean
}

export type MotionComponent = <T extends AsTag = 'div', K = any>(
  props: (T extends keyof JSX.IntrinsicElements ? MotionHTMLAttributes<T> : ComponentProps<T>) &
    MotionProps<T, K>,
) => JSX.Element

// ---------------------------------------------------------------------------
// Component factory
// ---------------------------------------------------------------------------

type MotionCompProps = {
  // Intrinsic element tag, e.g. motion.create('div').
  create<T extends keyof JSX.IntrinsicElements>(
    component: T,
    options?: MotionCreateOptions,
  ): DefineComponent<Omit<MotionProps<T, unknown>, 'as'> & MotionHTMLAttributes<T>>
  // Custom component, e.g. motion.create(MyComponent).
  create<T extends DefineComponent>(
    component: T,
    options?: MotionCreateOptions,
  ): DefineComponent<Omit<MotionProps<any, unknown>, 'as'> & ComponentProps<T>>
  // Unknown string tag (custom element): generic motion-aware HTML attributes.
  create(
    component: string,
    options?: MotionCreateOptions,
  ): DefineComponent<Omit<MotionProps<any, unknown>, 'as'> & MotionHTMLAttributes<'div'>>
}

export interface MotionCreateOptions {
  forwardMotionProps?: boolean
  renderer?: typeof createVisualElement
  /**
   * Force the render type for a custom component, e.g.
   * `motion.create(CustomSVG, { type: 'svg' })`, so SVG-specific attributes
   * (viewBox, etc.) animate correctly.
   */
  type?: 'html' | 'svg'
}

type MotionNameSpace = {
  [K in keyof JSX.IntrinsicElements]: DefineComponent<
    Omit<MotionProps<K, unknown>, 'as' | 'motionConfig' | 'layoutGroup'> & MotionHTMLAttributes<K>
  >
} & MotionCompProps

type InternalMotionProps = MotionProps<any>

const componentMaxCache = new Map<string | DefineComponent, DefineComponent>()
const componentMiniCache = new Map<string | DefineComponent, DefineComponent>()

function getRenderedComponent(component: string | DefineComponent, props: InternalMotionProps) {
  return props.as ?? component
}

/**
 * Creates a motion component from a base component or HTML tag.
 * Caches string-based components for reuse.
 */
function createMotionComponent(
  component: string | DefineComponent,
  options: MotionCreateOptions = {},
) {
  const isString = typeof component === 'string'
  const componentCache = options.renderer ? componentMaxCache : componentMiniCache
  const cachedComponent = componentCache.get(component)

  if (isString && cachedComponent) return cachedComponent

  const displayName = isString ? `motion.${component}` : 'Motion'

  const MotionComponent = {
    [displayName]: (props: InternalMotionProps) => {
      const forwardMotionProps = () => options.forwardMotionProps || props.forwardMotionProps
      const motionAttrs = createMotionAttrs(props, {
        defaultAs: component,
        forwardMotionProps: forwardMotionProps(),
        renderer: options.renderer,
        type: options.type,
      })
      const renderedComponent = getRenderedComponent(component, props)

      // For a custom component (not an intrinsic tag) whose sole child is a
      // MotionValue, motion/react unwraps it to its current value and forwards
      // that as `children` (rather than the live <MotionChildren> wrapper a DOM
      // tag renders). Mirror that, kept live via useMotionValueChild so the
      // value still tracks the MotionValue.
      const isCustomComponent = typeof renderedComponent !== 'string'
      const motionValueChild = untrack(() =>
        isCustomComponent && isMotionValueChild(props.children) ? props.children : undefined,
      )
      const customMotionValueChild = motionValueChild
        ? useMotionValueChild(motionValueChild)
        : undefined

      return (
        <motionAttrs.Provider>
          <Dynamic component={renderedComponent} {...motionAttrs(props)}>
            {customMotionValueChild ? (
              customMotionValueChild()
            ) : (
              <MotionChildren children={props.children} />
            )}
          </Dynamic>
        </motionAttrs.Provider>
      )
    },
  }[displayName]

  if (isString) componentCache.set(component, MotionComponent)

  return MotionComponent
}

const createMotionNamespace = (renderer?: typeof createVisualElement): MotionCompProps => ({
  create: (component: string | DefineComponent, createOptions?: MotionCreateOptions) =>
    createMotionComponent(component, {
      ...createOptions,
      renderer,
    }),
})

/**
 * Builds a motion namespace (`m.div`, `m.span`, …) backed by an optional
 * feature bundle. Pass `domMax` for the eager build; omit for the mini
 * build that pairs with `<LazyMotion>`.
 *
 * @example
 * ```ts
 * import { domMax } from 'motion-solidjs/features/dom-max'
 * export const motion = createMotionComponentWithFeatures(domMax)
 * // <motion.div animate={{ opacity: 1 }} />
 * ```
 */
export function createMotionComponentWithFeatures(featureBundle?: FeatureBundle): MotionNameSpace {
  const renderer = featureBundle?.renderer
  if (featureBundle?.machinery) installMotionMachinery(featureBundle.machinery)
  if (featureBundle) installFeatureDefinitions(featureBundle.features, featureBundle.projection)
  const namespace = createMotionNamespace(renderer)

  // Cast required: the proxy target only literally holds `create`; the
  // `motion.<tag>` components are synthesized lazily in `get`. The map in
  // `MotionNameSpace` is non-optional (see note there), so the target isn't
  // structurally assignable without this assertion.
  return new Proxy(namespace, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver)
      }

      if (typeof prop !== 'string') return undefined

      return createMotionComponent(prop, {
        renderer,
      })
    },
  }) as unknown as MotionNameSpace
}

// ---------------------------------------------------------------------------
// Public surface — the tree-shakeable `m.X` namespace (mini bundle, pairs
// with <LazyMotion>) and the generic `M` alias. The eager-renderer
// `motion`/`Motion` exports live in a sibling file (`motion-max.tsx`) that
// statically imports `domMax`. Splitting them lets bundlers drop
// `HTMLVisualElement` + `createVisualElement` from the import graph for
// consumers that only import `m`/`M`.
// ---------------------------------------------------------------------------

export const m = createMotionComponentWithFeatures()
export const M: MotionComponent = m.create('div')
