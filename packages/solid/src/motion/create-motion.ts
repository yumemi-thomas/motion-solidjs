import type { MotionValue, ResolvedValues, VisualElement } from 'motion-dom'
import { createComputed, createEffect, onCleanup, onMount, splitProps, untrack } from 'solid-js'

import { injectAnimatePresence } from '@/components/animate-presence/presence'
import type { PresenceContext } from '@/components/animate-presence/presence'
import { injectLayoutGroup, injectMotion, provideMotion } from '@/components/context'
import type { MotionProps } from '@/components/motion'
import { createMotionConfig } from '@/components/motion-config/context'
import type { StateType } from '@/features/animation'
import type { createVisualElement } from '@/features/dom-animation'
import type { MotionStateContext, Options } from '@/types'
import { invariant, isSVGElement, warning } from '@/utils/is'
import { resolveMotionProps } from '@/utils/resolve-motion-props'
import {
  createLazyMotionFeatureContext,
  createLazyMotionFeatureWatcher,
} from './lazy-motion-features'
import type { PresenceRegistration, PresenceRegistrationLifecycle } from './presence-registration'
import { initHandleProjection } from './projection-init'
import { requestRootProjectionUpdate } from './root-projection-update'
import { motionMachinery } from './machinery'
import { resolveMotionDomProps } from './motion-dom-props'
import {
  createVisualElementLifecycle,
  type VisualElementRenderer,
} from './visual-element-lifecycle'
import {
  createVariantContext,
  resolveInitialValues,
  resolveLateStyleMotionValues,
} from './initial-values'
import { buildMotionAttrs, cleanStylePropForMotionDom } from './motion-attrs-style'
import type { ResolvedOptions } from './motion-dom-props'
import type { MotionStyleRecord } from './render-style'

// ---------------------------------------------------------------------------
// MotionHandle — the motion node owned by each `<motion.*>` JSX element.
// ---------------------------------------------------------------------------

type GetSnapshotHook = (options: ResolvedOptions, isPresent?: boolean) => void
type DidUpdateHook = () => void

/**
 * Per-element motion state shared by the Solid lifecycle and feature modules.
 */
export interface MotionHandle {
  // ---- Lifecycle state ----------------------------------------------------
  type: 'html' | 'svg'
  element: HTMLElement | SVGElement | null
  options: ResolvedOptions & {
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

  // ---- Extension slots (writable) -----------------------------------------
  // getSnapshot/didUpdate are the Solid analogue of React's
  // getSnapshotBeforeUpdate/componentDidUpdate pair that framer's
  // MeasureLayout rides on: the layout feature rebinds them, and the
  // create-motion lifecycle invokes them around option updates.
  getSnapshot: GetSnapshotHook
  didUpdate: DidUpdateHook
  _staticReplayHook?: () => void
}

/** Public registry for tests and cross-subtree feature lookup. */
export const mountedStates = new WeakMap<Element, MotionHandle>()

/**
 * VisualElement → MotionHandle. Feature classes receive the VE (`this.node`,
 * motion-dom's contract) and reach the Solid-side handle through here.
 */
const visualElementHandles = new WeakMap<VisualElement<Element>, MotionHandle>()

export function getMotionHandle(ve: VisualElement<Element>): MotionHandle | undefined {
  return visualElementHandles.get(ve)
}

// Leak guard for the connection poll (~1s at 60fps). The realistic path
// connects within a frame or two; this only bounds a subtree that is created
// but never inserted.
const MAX_CONNECTION_FRAMES = 60

type HandleOptions = ResolvedOptions & {
  presenceContext?: PresenceContext
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
    type?: 'html' | 'svg'
  } = {},
): MotionHandle {
  let options = getOpts()
  // Solid's fine-grained updates don't always re-run siblings before layout
  // measurement; start a root update so drag/layout snapshots survive a new
  // layout-affecting node mounting. Delegated to the projection feature via
  // `requestRootProjectionUpdate` (no-op until that feature loads) so bare `m`
  // never statically imports the projection engine.
  if (options.layout || options.layoutId || options.drag) {
    requestRootProjectionUpdate()
  }
  let element: HTMLElement | SVGElement | null = null
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
  const type: 'html' | 'svg' = config.type ?? (isSVGElement(options.as) ? 'svg' : 'html')
  const children = new Set<MotionHandle>()
  const context = createVariantContext(
    () => options,
    () => parent,
  )
  const getContext = (): MotionStateContext => context

  let latestValues: ResolvedValues = resolveInitialValues(options, getContext())

  // Drive motion-dom's feature lifecycle: instantiate/mount/update the
  // Feature classes registered via setFeatureDefinitions. Projection is
  // per-VE infrastructure rather than a prop-gated feature (ancestors'
  // transforms participate in descendants' measurements), so it's
  // created/refreshed first, through the domMax-installed slot.
  const updateFeatures = () => {
    if (!element) return
    const visualElement = visualLifecycle.get()
    if (!visualElement) return
    initHandleProjection(handle)
    visualElement.updateFeatures()
  }

  const visualLifecycle = createVisualElementLifecycle({
    initialRenderer: config.renderer,
    getElement: () => element,
    getLatestValues: () => latestValues,
    getOptions: () => options,
    getParent: () => parent,
    // A forced `type: 'svg'` (e.g. motion.create(CustomSVG, { type: 'svg' }))
    // must build an SVGVisualElement so SVG-attribute animations (viewBox, …)
    // are written — createVisualElement picks HTML vs SVG by the tag, and a
    // custom component's tag isn't an SVG string.
    getTag: () => (type === 'svg' ? 'svg' : getElementTag(options.as)),
    type,
  })

  const initVisualElement = (r: VisualElementRenderer) => {
    // Late init (a LazyMotion bundle resolving after mount): style
    // MotionValues may have moved while the element rendered statically, so
    // catch their snapshot entries up before the VisualElement seeds from
    // it — its first frame-scheduled render would otherwise paint
    // creation-time values over the rebuilt attrs. Variant-resolved keys
    // stay untouched: they're animation origins.
    if (!visualLifecycle.get()) {
      Object.assign(latestValues, resolveLateStyleMotionValues(options, getContext()))
    }
    visualLifecycle.init(r)
    const visualElement = visualLifecycle.get()
    if (visualElement) visualElementHandles.set(visualElement, handle)
  }

  const ensureVisualElement = (): VisualElement<Element> | undefined => {
    const visualElement = visualLifecycle.ensure()
    if (visualElement) visualElementHandles.set(visualElement, handle)
    return visualElement
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
    const visualElement = visualLifecycle.get()
    for (const key in initialValues) {
      const value = initialValues[key]
      visualElement?.getValue(key)?.jump(value, false)
      visualLifecycle.setLatestValue(key, value)
    }
    visualLifecycle.render()
    // Re-run the mount pass so the replayed initial → animate transition
    // dispatches (presence re-entry, static replay).
    visualElement?.animationState?.reset()
    visualElement?.animationState?.animateChanges()
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

  const getPresenceRegistration = (): PresenceRegistration | undefined => {
    if (!presenceRegistration) {
      presenceRegistration = untrack(motionMachinery)?.createPresenceRegistration(
        handle,
        presenceLifecycle,
      )
    }
    return presenceRegistration
  }
  const registerWithPresence = (el: HTMLElement | SVGElement) => {
    getPresenceRegistration()?.register(el)
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
    // With a renderer available every motion node owns a VE (framer parity —
    // use-visual-element constructs one per component); features hang off it.
    ensureVisualElement()
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
    // VE unmount also unmounts all mounted features.
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
      // Runs each mounted feature's update() (animation dispatch, gesture
      // re-config, projection setOptions) — the Solid analogue of React's
      // post-commit updateFeatures call.
      updateFeatures()
      handle.didUpdate()
    })
  })

  // Machinery can arrive after mount (async LazyMotion bundle): register
  // with AnimatePresence then. Style MotionValues re-register live through
  // the attrs rebuild (see createMotion's getAttrs).
  createEffect(() => {
    if (!motionMachinery()) return
    untrack(() => {
      if (element && !presenceRegistration?.isRegistered()) registerWithPresence(element)
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
    _staticReplayHook: replayStaticTree,
  }

  const presenceLifecycle: PresenceRegistrationLifecycle = {
    attach,
    isAttached: () => hasAttached,
    getElement: () => element,
    replayInitialAnimation,
    setPresenceContainer(value) {
      presenceContainer = value
    },
  }

  parent?.children.add(handle)
  return handle
}

type PropsWithoutChildren = Omit<MotionProps, 'children'>

export interface CreateMotionOptions {
  defaultAs?: MotionProps<any>['as']
  renderer?: typeof createVisualElement
  /** Force the render type (e.g. `motion.create(CustomSVG, { type: 'svg' })`). */
  type?: 'html' | 'svg'
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

  const attrs: MotionStyleRecord = {}

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
    type: options.type,
  })
  provideMotion(state)
  // Eagerly re-read the merged props on every change. The spread consumer
  // evaluates `motionAttrs` through a lazy memo whose dependency set can be
  // collected in a context that misses prop reads (leaving the style spread
  // stale until the next frame render); a hot subscriber re-evaluating the
  // full props each flush keeps that evaluation fresh. The pre-Feature
  // architecture got this incidentally from per-feature getOpts effects.
  createEffect(() => {
    getMotionProps()
  })
  createLazyMotionFeatureWatcher(state, lazyMotionContext)

  function getAttrs() {
    // Tracked read: when a LazyMotion bundle installs the machinery, rebuild
    // the attrs so style MotionValues register live subscriptions — the
    // Solid analogue of motion/react re-rendering once lazy features resolve.
    motionMachinery()
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
