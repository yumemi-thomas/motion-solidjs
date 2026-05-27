import { globalProjectionState, rootProjectionNode } from 'motion-dom'
import type { MotionValue, ResolvedValues, VisualElement } from 'motion-dom'
import { createComputed, createEffect, onCleanup, onMount, splitProps, untrack } from 'solid-js'

import { injectAnimatePresence } from '@/components/animate-presence/presence'
import type { PresenceContext } from '@/components/animate-presence/presence'
import { injectLayoutGroup, injectMotion, provideMotion } from '@/components/context'
import type { MotionProps } from '@/components/motion'
import { createMotionConfig } from '@/components/motion-config/context'
import type { StateType } from '@/features/animation'
import type { BindingFactory, createVisualElement } from '@/features/dom-animation'
import type { MotionStateContext, MotionStyleProps, Options } from '@/types'
import { invariant, isSVGElement, warning } from '@/utils/is'
import { resolveMotionProps } from '@/utils/resolve-motion-props'
import {
  createFeatureBindingController,
  createLazyMotionFeatureContext,
  createLazyMotionFeatureWatcher,
  type FeatureBindingController,
} from './feature-binding'
import { createPresenceRegistration, type PresenceRegistration } from './presence-registration'
import { createValueRegistry, type ValueRegistry } from './value-registry'
import { resolveMotionDomProps } from './motion-dom-props'
import {
  createVisualElementLifecycle,
  type VisualElementRenderer,
} from './visual-element-lifecycle'
import { createStyleWriterLifecycle } from './style-writer-lifecycle'
import { createVariantContext, resolveInitialValues } from './initial-values'
import { buildMotionAttrs, cleanStylePropForMotionDom } from './motion-attrs-style'

// ---------------------------------------------------------------------------
// MotionHandle — the motion node owned by each `<motion.*>` JSX element.
// ---------------------------------------------------------------------------

type GetSnapshotHook = (options: Options, isPresent?: boolean) => void
type DidUpdateHook = () => void

/**
 * Per-element motion state shared by the Solid lifecycle and feature modules.
 */
export interface MotionHandle {
  // ---- Lifecycle state ----------------------------------------------------
  type: 'html' | 'svg'
  element: HTMLElement | SVGElement | null
  options: Options & {
    presenceContext?: PresenceContext
  }
  visualElement: VisualElement<Element> | undefined
  latestValues: ResolvedValues
  isExiting: boolean
  isInitialMountPending: boolean
  presenceContainer: HTMLElement | null
  parent?: MotionHandle
  children: Set<MotionHandle>

  // ---- Variant inheritance ------------------------------------------------
  readonly context: MotionStateContext

  // ---- Queries ------------------------------------------------------------
  isMounted(): boolean
  hasPendingInitialParent(): boolean

  // ---- Lifecycle commands -------------------------------------------------
  setActive(name: StateType, isActive: boolean): Promise<void>
  unmount(): void
  setElement(element: HTMLElement | SVGElement | null): void
  /**
   * Run `fn` once the element is connected to the document. Fires
   * synchronously if already connected, otherwise defers until a
   * disconnected→connected transition is observed (see {@link createMotionHandle}).
   *
   * Features doing DOM-dependent setup at mount (animation dispatch, layout
   * measurement) must gate that work through this hook: during CSR route
   * changes Solid builds the subtree off-document before inserting it, so the
   * element is not yet connected at `onMount`/effect time.
   */
  onConnected(fn: () => void): void
  updateFeatures(): void
  initVisualElement(renderer: VisualElementRenderer): void
  ensureVisualElement(): VisualElement<Element> | undefined
  getValueRegistry(): ValueRegistry
  attachStyleWriter(mv: MotionValue): void
  setStyleMotionValue(key: string, mv: MotionValue): void
  setStyleStaticValue(key: string, value: unknown): void

  // ---- Extension slots (writable) -----------------------------------------
  getSnapshot: GetSnapshotHook
  didUpdate: DidUpdateHook
  _replayHook?: () => void
  _staticReplayHook?: () => void
  _animationUpdateHook?: () => void
}

/** Public registry for tests and cross-subtree feature lookup. */
export const mountedStates = new WeakMap<Element, MotionHandle>()

// Leak guard for the connection poll (~1s at 60fps). The realistic path
// connects within a frame or two; this only bounds a subtree that is created
// but never inserted.
const MAX_CONNECTION_FRAMES = 60

type HandleOptions = Options & {
  presenceContext?: PresenceContext
  features?: BindingFactory[]
}

function isElement(value: unknown): value is Element {
  return value instanceof Element
}

function getElementTag(as: Options['as']) {
  return typeof as === 'string' ? as : 'div'
}

function pruneDisconnectedChildren(visualElement?: VisualElement) {
  let current = visualElement
  while (current) {
    const c = current
    c.children?.forEach((child) => {
      if (!isElement(child.current) || !child.current.isConnected) {
        c.children.delete(child)
      }
    })
    c.variantChildren?.forEach((child) => {
      if (!isElement(child.current) || !child.current.isConnected) {
        c.variantChildren?.delete(child)
      }
    })
    current = current.parent
  }
}

function createMotionHandle(
  getOpts: () => HandleOptions,
  parent?: MotionHandle,
  config: {
    renderer?: VisualElementRenderer
  } = {},
): MotionHandle {
  let options = getOpts()
  // Solid's fine-grained updates don't always re-run siblings before layout
  // measurement; start a root update so drag/layout snapshots survive a new
  // layout-affecting node mounting.
  if (
    globalProjectionState.hasEverUpdated &&
    rootProjectionNode.current &&
    !rootProjectionNode.current.isUpdating &&
    (options.layout || options.layoutId || options.drag)
  ) {
    rootProjectionNode.current.startUpdate()
  }
  let element: HTMLElement | SVGElement | null = null
  let valueRegistry: ValueRegistry | undefined
  let isExiting = false
  let presenceContainer: HTMLElement | null = null
  let isInitialMountPending = false

  // --- Connection gate -----------------------------------------------------
  // There is no native "connected to document" event for regular elements,
  // so we detect a disconnected→connected transition by polling rAF. The
  // poll is capped purely as a leak guard; in practice the router inserts the
  // subtree within a frame or two. `detach()` cancels it.
  let connectionRaf: number | undefined
  let connectionFrames = 0
  const connectedCallbacks: Array<() => void> = []
  const flushConnected = () => {
    const callbacks = connectedCallbacks.splice(0)
    for (const cb of callbacks) cb()
  }
  const watchConnection = () => {
    if (connectionRaf !== undefined) return
    if (typeof requestAnimationFrame === 'undefined') {
      flushConnected()
      return
    }
    const tick = () => {
      connectionRaf = undefined
      if (!element) {
        connectedCallbacks.length = 0
        return
      }
      if (element.isConnected || ++connectionFrames > MAX_CONNECTION_FRAMES) {
        flushConnected()
        return
      }
      connectionRaf = requestAnimationFrame(tick)
    }
    connectionRaf = requestAnimationFrame(tick)
  }
  const onConnected = (fn: () => void) => {
    if (element && element.isConnected) {
      fn()
      return
    }
    connectedCallbacks.push(fn)
    watchConnection()
  }
  let getSnapshot: GetSnapshotHook = () => {}
  let didUpdate: DidUpdateHook = () => {}
  const type: 'html' | 'svg' = isSVGElement(options.as) ? 'svg' : 'html'
  const children = new Set<MotionHandle>()
  const getValueRegistry = (): ValueRegistry => {
    if (!valueRegistry) valueRegistry = createValueRegistry()
    return valueRegistry
  }
  const styleWriter = createStyleWriterLifecycle({
    getElement: () => element,
    getRegistry: getValueRegistry,
    type,
  })
  const attachStyleWriter = (mv: MotionValue): void => {
    styleWriter.attach(mv)
  }
  const setStyleMotionValue = (key: string, mv: MotionValue): void => {
    getValueRegistry().setExternal(key, mv)
    attachStyleWriter(mv)
    visualLifecycle.get()?.addValue(key, mv)
  }
  const setStyleStaticValue = (key: string, value: unknown): void => {
    const mv = getValueRegistry().setStatic(key, value)
    attachStyleWriter(mv)
    visualLifecycle.get()?.addValue(key, mv)
  }
  const context = createVariantContext(
    () => options,
    () => parent,
  )
  const getContext = (): MotionStateContext => context

  let latestValues: ResolvedValues = resolveInitialValues(options, getContext())

  let featureBindings: FeatureBindingController | undefined

  const updateFeatures = () => featureBindings?.update()

  const visualLifecycle = createVisualElementLifecycle({
    initialRenderer: config.renderer,
    getElement: () => element,
    getLatestValues: () => latestValues,
    getOptions: () => options,
    getParent: () => parent,
    getTag: () => getElementTag(options.as),
    type,
  })

  const initVisualElement = (r: VisualElementRenderer) => {
    visualLifecycle.init(r)
  }

  const ensureVisualElement = (): VisualElement<Element> | undefined => {
    return visualLifecycle.ensure()
  }

  const setActive = (name: StateType, isActive: boolean): Promise<void> => {
    if (name === 'exit' && isActive) {
      isExiting = true
    }
    return Promise.resolve()
  }

  const replayInitialAnimation = () => {
    const initialValues = resolveInitialValues(options, getContext())
    latestValues = initialValues
    const registry = getValueRegistry()
    for (const key in initialValues) {
      const value = initialValues[key]
      const mv = registry.get(key)
      if (mv) mv.jump(value, false)
      visualLifecycle.setLatestValue(key, value)
    }
    visualLifecycle.render()
    handle._replayHook?.()
    updateFeatures()
  }

  const replayStaticTree = () => {
    replayInitialAnimation()
    for (const child of children) {
      child._staticReplayHook?.()
    }
  }

  let presenceRegistration: PresenceRegistration | undefined
  let hasAttached = false

  const registerWithPresence = (el: HTMLElement | SVGElement) => {
    presenceRegistration?.register(el)
  }

  const attach = (el: HTMLElement | SVGElement) => {
    invariant(Boolean(el), 'Animation state must be mounted with valid Element')
    if (hasAttached) return
    hasAttached = true
    const existing = mountedStates.get(el)
    if (existing && existing !== handle) {
      existing.unmount()
    }
    mountedStates.set(el, handle)
    element = el
    visualLifecycle.mount(el)
    visualLifecycle.render()
    pruneDisconnectedChildren(visualLifecycle.get())
    isInitialMountPending = true
    updateFeatures()
    queueMicrotask(() => {
      queueMicrotask(() => {
        isInitialMountPending = false
      })
    })

    if (!presenceRegistration?.isRegistered()) registerWithPresence(el)
  }

  const detach = () => {
    parent?.children.delete(handle)
    if (element) mountedStates.delete(element)
    if (connectionRaf !== undefined && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(connectionRaf)
    }
    connectionRaf = undefined
    connectedCallbacks.length = 0
    presenceRegistration?.unregister()
    styleWriter.dispose()
    featureBindings?.dispose()
    valueRegistry?.dispose()
    visualLifecycle.unmount()
    element = null
    hasAttached = false
  }

  const setElement = (el: HTMLElement | SVGElement | null) => {
    element = el
    if (el && !presenceRegistration?.isRegistered()) registerWithPresence(el)
  }

  let isFirstRun = true
  createComputed(() => {
    const next = getOpts()
    if (isFirstRun) return
    untrack(() => {
      handle.getSnapshot(options, undefined)
      options = next
      visualLifecycle.update(next)
      visualLifecycle.syncForcedStyleValues(next)
      visualLifecycle.render()
      if (next.motionConfig?.isStatic) replayStaticTree()
    })
  })

  createEffect(() => {
    getOpts()
    if (isFirstRun) {
      isFirstRun = false
      return
    }
    untrack(() => {
      pruneDisconnectedChildren(visualLifecycle.get())
      updateFeatures()
      handle._animationUpdateHook?.()
      handle.didUpdate()
    })
  })

  onMount(() => {
    if (element) attach(element)
  })

  onCleanup(() => {
    handle.getSnapshot(options, false)
    // Inside AnimatePresence the DOM node is preserved across owner disposal
    // so the exit animation can run; AnimatePresence calls handle.unmount()
    // via its own bookkeeping once the exit completes. Outside Presence,
    // onCleanup is the end of the lifecycle — tear down now.
    const inAnimatePresence = Boolean(options.presenceContext?.register)
    if (inAnimatePresence && element?.isConnected) {
      queueMicrotask(() => {
        if (!element?.isConnected) detach()
      })
      return
    }
    detach()
  })

  const handle: MotionHandle = {
    get type() {
      return type
    },
    get element() {
      return element
    },
    get options() {
      return options
    },
    get visualElement() {
      return visualLifecycle.get()
    },
    get latestValues() {
      return latestValues
    },
    get isExiting() {
      return isExiting
    },
    set isExiting(value: boolean) {
      isExiting = value
    },
    get presenceContainer() {
      return presenceContainer
    },
    set presenceContainer(value) {
      presenceContainer = value
    },
    get parent() {
      return parent
    },
    get context() {
      return getContext()
    },
    get children() {
      return children
    },
    get isInitialMountPending() {
      return isInitialMountPending
    },
    get getSnapshot() {
      return getSnapshot
    },
    set getSnapshot(value) {
      getSnapshot = value
    },
    get didUpdate() {
      return didUpdate
    },
    set didUpdate(value) {
      didUpdate = value
    },

    isMounted: () => Boolean(element),
    hasPendingInitialParent: () => {
      let p: MotionHandle | undefined = parent
      while (p) {
        if (p.isInitialMountPending) return true
        p = p.parent
      }
      return false
    },
    setActive,
    unmount: detach,
    onConnected,

    setElement,
    updateFeatures,
    initVisualElement,
    ensureVisualElement,
    getValueRegistry,
    attachStyleWriter,
    setStyleMotionValue,
    setStyleStaticValue,
    _staticReplayHook: replayStaticTree,
  }

  parent?.children.add(handle)
  featureBindings = createFeatureBindingController(handle, getOpts)
  presenceRegistration = createPresenceRegistration(handle, {
    attach,
    isAttached: () => hasAttached,
    getElement: () => element,
    replayInitialAnimation,
    setPresenceContainer(value) {
      presenceContainer = value
    },
  })
  return handle
}

type PropsWithoutChildren = Omit<MotionProps, 'children'>

export interface CreateMotionOptions {
  defaultAs?: MotionProps<any>['as']
  renderer?: typeof createVisualElement
}

/**
 * Build a motion handle for a Solid element. Wires up reactive option
 * tracking, the variant context, the value registry, and the visual-element
 * lifecycle. Returns `getProps`/`getAttrs`/`setElement` to drive a Solid
 * render plus the underlying `state` (a `MotionHandle`).
 *
 * Most consumers should reach for {@link createMotionAttrs} or `useMotion`;
 * `createMotion` is the lower-level primitive that they sit on top of.
 *
 * @example
 * ```tsx
 * function Box(props: MotionProps) {
 *   const motion = createMotion(props)
 *   return <div {...motion.getAttrs()} ref={motion.setElement} />
 * }
 * ```
 */
export function createMotion(props: MotionProps, options: CreateMotionOptions = {}) {
  // Do not spread children into motion options; reading Solid children here can
  // evaluate nested JSX too early and break hydration.
  const [, propsWithoutChildren] = splitProps(props, ['children'])
  const parentState = injectMotion(null)
  const layoutGroup = injectLayoutGroup({})
  const config = createMotionConfig()
  const presenceContext = injectAnimatePresence({})
  const lazyMotionContext = createLazyMotionFeatureContext()

  if (process.env.NODE_ENV !== 'production' && options.renderer && lazyMotionContext.strict()) {
    const strictMessage =
      'You have rendered a `motion` component within a `LazyMotion` component. This will break tree shaking. Import and render a `m` component instead.'
    props.ignoreStrict ? warning(false, strictMessage) : invariant(false, strictMessage)
  }

  const attrs: Record<string, MotionStyleProps[string]> = {}

  function getProps() {
    const rawProps = {
      ...propsWithoutChildren,
      as: props.as ?? options.defaultAs,
    } satisfies PropsWithoutChildren

    return resolveMotionProps(
      {
        ...rawProps,
        style: cleanStylePropForMotionDom(rawProps.style, rawProps),
      },
      {
        layoutGroup,
        presenceContext,
        config: config(),
      },
    )
  }
  function getMotionProps() {
    return {
      ...attrs,
      ...getProps(),
    }
  }

  const state = createMotionHandle(getMotionProps, parentState ?? undefined, {
    renderer: options.renderer,
  })
  provideMotion(state)
  createLazyMotionFeatureWatcher(state, lazyMotionContext)

  function getAttrs() {
    return buildMotionAttrs({
      attrs,
      motionProps: getProps(),
      props,
      state,
    })
  }

  const setElement = (el: HTMLElement | SVGElement | null) => state.setElement(el)

  return {
    getProps,
    getAttrs,
    layoutGroup,
    setElement,
    state,
  }
}
