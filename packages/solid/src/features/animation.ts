import type {
  AnimationDefinition,
  AnimationState,
  TargetAndTransition,
  VariantLabels,
  VisualElement,
  VisualElementAnimationOptions,
} from 'motion-dom'
import {
  animateVisualElement,
  calcChildStagger,
  defaultTransformValue,
  isAnimationControls,
  isVariantLabel,
  transformProps,
} from 'motion-dom'
import { createEffect, untrack } from 'solid-js'
import { animateTarget } from '@/motion/animate-target'
import type { MotionHandle } from '@/motion/create-motion'
import { resolveVariant } from '@/motion/resolve-variant'

const STATE_TYPES = [
  'animate',
  'whileInView',
  'whileHover',
  'whileTap',
  'whileDrag',
  'whileFocus',
  'exit',
] as const
export type StateType = (typeof STATE_TYPES)[number]

// Ported from motion-dom/dist/es/render/utils/animation-state.mjs — kept
// structurally close to upstream so diffs apply cleanly.

function shallowCompare(next: unknown[], prev: unknown[]) {
  const prevLength = prev?.length

  if (prevLength !== next.length) return false

  for (let i = 0; i < prevLength; i++) {
    if (prev[i] !== next[i]) return false
  }

  return true
}

const variantProps = [
  'initial',
  'animate',
  'exit',
  'whileHover',
  'whileDrag',
  'whileFocus',
  'whileTap',
] as const

type VariantStateContext = {
  initial?: boolean | TargetAndTransition | VariantLabels
  animate?: string | string[]
  exit?: string | string[]
  whileHover?: string | string[]
  whileDrag?: string | string[]
  whileFocus?: string | string[]
  whileTap?: string | string[]
}

/**
 * A motion node is "controlling variants" when any of its variant slots
 * (`initial`, `animate`, `exit`, `whileHover`, `whileTap`, `whileDrag`,
 * `whileFocus`, `whileInView`) carries a variant *label* (string or array
 * of strings). Mirrors motion-dom's `isControllingVariants` but takes our
 * `MotionHandle['options']` shape directly — no VE traversal.
 */
function ownsVariants(options: MotionHandle['options']): boolean {
  return (
    isVariantLabel(options.initial) ||
    isVariantLabel(options.animate) ||
    isVariantLabel(options.exit) ||
    isVariantLabel(options.whileHover) ||
    isVariantLabel(options.whileTap) ||
    isVariantLabel(options.whileDrag) ||
    isVariantLabel(options.whileFocus) ||
    isVariantLabel(options.whileInView)
  )
}

/**
 * Solid-side equivalent of `motion-dom`'s `VisualElement.getBaseTarget`.
 * Returns the value to revert `key` to when its driving animation
 * deactivates. Walk order:
 *
 *   1. `props.initial` resolved as variant (key wins from there if set)
 *   2. `props.style[key]` (the static-style baseline)
 *   3. `handle.latestValues[key]` (the most recent applied value)
 *   4. motion-dom's transform default (scale → 1, x → 0, …) for transform
 *      keys; otherwise `undefined`.
 *
 * Differences vs. motion-dom's version:
 *   - No DOM read via `getComputedStyle` / `readTransformValue`. The
 *     writer keeps inline style current, so the rare case "no signal at
 *     all, fall back to whatever's painted" doesn't arise in practice.
 *   - Used only when no VE exists on the handle. VE-backed paths
 *     (drag/layout/SVG) keep calling `visualElement.getBaseTarget` for
 *     full motion-dom parity.
 */
function getBaseTargetSolidSide(handle: MotionHandle, key: string): unknown {
  const opts = handle.options
  const initial = opts.initial
  if (typeof initial === 'string' || (typeof initial === 'object' && initial !== null)) {
    const resolved = resolveVariant(
      Array.isArray(initial) ? initial[0] : initial,
      opts.variants,
      opts.custom,
    )
    if (resolved && key in resolved) {
      const v = resolved[key]
      if (v !== undefined) return v
    }
  }
  const style = opts.style
  if (style && style[key] !== undefined) return style[key]
  const latest = handle.latestValues[key]
  if (latest !== undefined) return latest
  if (transformProps.has(key)) return defaultTransformValue(key)
  return undefined
}

function getVariantContext(handle?: MotionHandle): undefined | VariantStateContext {
  if (!handle) return undefined

  if (!ownsVariants(handle.options)) {
    const context = handle.parent ? getVariantContext(handle.parent) || {} : {}
    if (handle.options.initial !== undefined) {
      context.initial = handle.options.initial
    }
    return context
  }

  const context: VariantStateContext = {}
  for (let i = 0; i < variantProps.length; i++) {
    const name = variantProps[i]
    const prop = handle.options[name]

    if (name === 'initial' && prop === false) {
      context[name] = prop
    } else if (isVariantLabel(prop)) {
      context[name] = prop
    }
  }

  return context
}

// --- Aligned with motion-dom variantPriorityOrder ---
const variantPriorityOrder = [
  'animate',
  'whileInView',
  'whileFocus',
  'whileHover',
  'whileTap',
  'whileDrag',
  'exit',
] as const

type AnimationType = (typeof variantPriorityOrder)[number]

const reversePriorityOrder = [...variantPriorityOrder].reverse()
const numAnimationTypes = variantPriorityOrder.length

interface AnimationTypeState {
  isActive: boolean
  protectedKeys: Record<string, true>
  needsAnimating: Record<string, boolean>
  prevResolvedValues: Record<string, any>
  prevProp?: any
}

function createTypeState(isActive = false): AnimationTypeState {
  return {
    isActive,
    protectedKeys: {},
    needsAnimating: {},
    prevResolvedValues: {},
  }
}

function createState(): Record<string, AnimationTypeState> {
  return {
    animate: createTypeState(true),
    whileInView: createTypeState(),
    whileHover: createTypeState(),
    whileTap: createTypeState(),
    whileDrag: createTypeState(),
    whileFocus: createTypeState(),
    exit: createTypeState(),
  }
}

function checkVariantsDidChange(prev: any, next: any): boolean {
  if (typeof next === 'string') {
    return next !== prev
  } else if (Array.isArray(next)) {
    return !shallowCompare(next, prev)
  }
  return false
}

function isKeyframesTarget(v: any): v is any[] {
  return Array.isArray(v)
}

interface AnimationStateAPI {
  animateChanges: (changedActiveType?: AnimationType) => Promise<any>
  setActive: (type: AnimationType, isActive: boolean) => Promise<any>
  setAnimateFunction: AnimationState['setAnimateFunction']
  getState: () => Record<string, AnimationTypeState>
  reset: () => void
}

interface DefinitionAndOptions {
  animation: AnimationDefinition
  options?: VisualElementAnimationOptions
}

// Per-handle state machine — the cascade's recursion target. Replaces
// motion-dom's `ve.animationState` so child machines are reachable from
// their handle without going through a visual element. Exported so
// create-motion.ts's setActive can route through it.
export const stateMachines = new WeakMap<MotionHandle, AnimationStateAPI>()

function getStateMachine(handle: MotionHandle): AnimationStateAPI {
  const machine = stateMachines.get(handle)
  if (!machine) {
    throw new Error('Animation state missing for motion handle.')
  }
  return machine
}

function createAnimationState(
  handle: MotionHandle,
  featureAttachedAfterMount: boolean,
): AnimationStateAPI {
  let state = createState()
  let isInitialRender = true

  // Dispatch per animation shape: variant labels and TargetResolver
  // functions go through motion-dom (needs the variantChildren cascade);
  // target objects flow through the Solid-side animateTarget.
  const animate = (animations: DefinitionAndOptions[]) => {
    return Promise.all(
      animations.map(({ animation, options }) => {
        if (
          typeof animation === 'string' ||
          Array.isArray(animation) ||
          typeof animation === 'function'
        ) {
          // Allocate a VE lazily so non-label dispatches don't pay for it,
          // and mirror our state machine into ve.animationState so the
          // cascade walk finds the same state.
          const ve = handle.ensureVisualElement()
          if (!ve) return Promise.resolve()
          if (!ve.animationState) ve.animationState = getStateMachine(handle)
          return animateVisualElement(ve, animation, options)
        }
        // Defensive: animateChanges filters LegacyAnimationControls before
        // pushing into `animations`, so this branch shouldn't be reached.
        if (isAnimationControls(animation)) return Promise.resolve()
        const protectedState = options?.type ? state[options.type] : undefined
        // motion-dom fires AnimationStart/Complete via ve.notify; Solid-side
        // dispatch is VE-free so we invoke the prop callbacks directly. If
        // we also called ve.notify, drag/layout-allocated VEs would fire
        // each callback twice.
        const onStart = handle.options.onAnimationStart
        const onComplete = handle.options.onAnimationComplete
        if (onStart) onStart(animation)
        const completions = animateTarget(handle, animation, {
          delay: options?.delay,
          transitionOverride: options?.transitionOverride,
          protectedState,
        })
        return Promise.all(completions).then(() => {
          if (onComplete) onComplete(animation)
        })
      }),
    )
  }

  /**
   * This function will be used to reduce the animation definitions for
   * each active animation type into an object of resolved values for it.
   */
  const buildResolvedTypeValues =
    (type: AnimationType) =>
    (acc: { [key: string]: any }, definition: string | TargetAndTransition | undefined) => {
      // For exit, the custom value flows from the surrounding AnimatePresence
      // (its `custom` prop). For all other types, custom comes from the
      // node's own `custom` option — passed through here so function-shaped
      // variants resolve consistently.
      const customForType =
        type === 'exit' ? handle.options.presenceContext?.custom : handle.options.custom
      const resolved = resolveVariant(definition, handle.options.variants, customForType)

      if (resolved) {
        const { transition, transitionEnd, ...target } = resolved
        acc = { ...acc, ...target, ...transitionEnd }
      }

      return acc
    }

  /**
   * When we receive new props, we need to:
   * 1. Create a list of protected keys for each type. This is a directory of
   *    value keys that are currently being "handled" by types of a higher priority
   *    so that whenever an animation is played of a given type, these values are
   *    protected from being animated.
   * 2. Determine if an animation type needs animating.
   * 3. Determine if any values have been removed from a type and figure out
   *    what to animate those to.
   */
  function animateChanges(changedActiveType?: AnimationType) {
    const props = handle.options
    // VE may be undefined when no feature has needed one yet. Read locally
    // for the paths that still consult motion-dom (label cascade, stagger
    // walk via `ve.parent.enteringChildren`).
    const visualElement: VisualElement | undefined = handle.visualElement
    const context = getVariantContext(handle.parent) || {}
    // True when the parent already mounted OR our feature attached AFTER
    // mount (LazyMotion async path). Mirrors upstream's
    // `Boolean(parent && parent.current)` + post-mount `hasMountedOnce`
    // branch — without the latter, the initial==animate suppression at
    // the bottom would swallow a state change that landed before features
    // loaded (#2759).
    const manuallyAnimateOnMount =
      Boolean(handle.parent && handle.parent.element) || featureAttachedAfterMount
    // Upstream derives this from `presenceContext.initial === false`, NOT
    // `props.initial === false` (use-visual-element.ts:70). The Solid port
    // previously read props.initial and broke #2759 for the LazyMotion
    // async path.
    const blockInitialAnimation = props.presenceContext?.initial === false
    /**
     * A list of animations that we'll build into as we iterate through the animation
     * types. This will get executed at the end of the function.
     */
    const animations: Array<DefinitionAndOptions> = []

    /**
     * Keep track of which values have been removed. Then, as we hit lower priority
     * animation types, we can check if they contain removed values and animate to that.
     */
    const removedKeys = new Set<string>()

    /**
     * A dictionary of all encountered keys. This is an object to let us build into and
     * copy it without iteration. Each time we hit an animation type we set its protected
     * keys - the keys its not allowed to animate - to the latest version of this object.
     */
    let encounteredKeys: Record<string, true> = {}

    /**
     * If a variant has been removed at a given index, and this component is controlling
     * variant animations, we want to ensure lower-priority variants are forced to animate.
     */
    let removedVariantIndex = Infinity

    /**
     * Iterate through all animation types in reverse priority order. For each, we want to
     * detect which values it's handling and whether or not they've changed (and therefore
     * need to be animated). If any values have been removed, we want to detect those in
     * lower priority props and flag for animation.
     */
    for (let i = 0; i < numAnimationTypes; i++) {
      const type = reversePriorityOrder[i]
      const typeState = state[type]
      const prop: string | TargetAndTransition | undefined =
        props[type] !== undefined ? props[type] : context[type]
      const propIsVariant = isVariantLabel(prop)

      /**
       * If this type has *just* changed isActive status, set activeDelta
       * to that status. Otherwise set to null.
       */
      const activeDelta = type === changedActiveType ? typeState.isActive : null
      if (activeDelta === false) removedVariantIndex = i

      /**
       * If this prop is an inherited variant, rather than been set directly on the
       * component itself, we want to make sure we allow the parent to trigger animations.
       *
       * TODO: Can probably change this to a !isControllingVariants check
       */
      let isInherited = prop === context[type] && prop !== props[type] && propIsVariant

      if (isInherited && isInitialRender && manuallyAnimateOnMount) {
        isInherited = false
      }

      /**
       * Set all encountered keys so far as the protected keys for this type. This will
       * be any key that has been animated or otherwise handled by active, higher-priority types.
       */
      typeState.protectedKeys = { ...encounteredKeys }

      // Check if we can skip analysing this prop early
      if (
        // If it isn't active and hasn't *just* been set as inactive
        (!typeState.isActive && activeDelta === null) ||
        // If we didn't and don't have any defined prop for this animation type
        (!prop && !typeState.prevProp) ||
        // Or if the prop doesn't define an animation
        isAnimationControls(prop) ||
        typeof prop === 'boolean'
      ) {
        continue
      }

      /**
       * As we go look through the values defined on this type, if we detect
       * a changed value or a value that was removed in a higher priority, we set
       * this to true and add this prop to the animation list.
       */
      const variantDidChange = checkVariantsDidChange(typeState.prevProp, prop)
      let shouldAnimateType =
        variantDidChange ||
        // If we're making this variant active, we want to always make it active
        (type === changedActiveType && typeState.isActive && !isInherited && propIsVariant) ||
        // If we removed a higher-priority variant (i is in reverse order)
        (i > removedVariantIndex && propIsVariant)

      let handledRemovedValues = false

      /**
       * As animations can be set as variant lists, variants or target objects, we
       * coerce everything to an array if it isn't one already
       */
      const definitionList = Array.isArray(prop) ? prop : [prop]

      /**
       * Build an object of all the resolved values. We'll use this in the subsequent
       * animateChanges calls to determine whether a value has changed.
       */
      let resolvedValues = definitionList.reduce(buildResolvedTypeValues(type), {})
      if (activeDelta === false) resolvedValues = {}

      /**
       * Now we need to loop through all the keys in the prev prop and this prop,
       * and decide:
       * 1. If the value has changed, and needs animating
       * 2. If it has been removed, and needs adding to the removedKeys set
       * 3. If it has been removed in a higher priority type and needs animating
       * 4. If it hasn't been removed in a higher priority but hasn't changed, and
       *    needs adding to the type's protectedKeys list.
       */
      const { prevResolvedValues = {} } = typeState
      const allKeys = {
        ...prevResolvedValues,
        ...resolvedValues,
      }

      const markToAnimate = (key: string) => {
        shouldAnimateType = true
        if (removedKeys.has(key)) {
          handledRemovedValues = true
          removedKeys.delete(key)
        }
        typeState.needsAnimating[key] = true

        // liveStyle = false tells motion-dom's render path not to fall
        // back to the style/initial baseline for this key.
        const mv = handle.getValueRegistry().get(key) ?? visualElement?.getValue(key)
        if (mv) mv.liveStyle = false
      }

      for (const key in allKeys) {
        const next = resolvedValues[key]
        const prev = prevResolvedValues[key]

        // If we've already handled this we can just skip ahead
        if (Object.hasOwnProperty.call(encounteredKeys, key)) continue

        /**
         * If the value has changed, we probably want to animate it.
         */
        let valueHasChanged = false
        if (isKeyframesTarget(next) && isKeyframesTarget(prev)) {
          valueHasChanged = !shallowCompare(next, prev)
        } else {
          valueHasChanged = next !== prev
        }

        if (valueHasChanged) {
          if (next !== undefined && next !== null) {
            // If next is defined and doesn't equal prev, it needs animating
            markToAnimate(key)
          } else {
            // If it's undefined, it's been removed.
            removedKeys.add(key)
          }
        } else if (next !== undefined && removedKeys.has(key)) {
          /**
           * If next hasn't changed and it isn't undefined, we want to check if it's
           * been removed by a higher priority
           */
          markToAnimate(key)
        } else {
          /**
           * If it hasn't changed, we add it to the list of protected values
           * to ensure it doesn't get animated.
           */
          typeState.protectedKeys[key] = true
        }
      }

      /**
       * Update the typeState so next time animateChanges is called we can compare the
       * latest prop and resolvedValues to these.
       */
      typeState.prevProp = prop
      typeState.prevResolvedValues = resolvedValues

      if (typeState.isActive) {
        encounteredKeys = { ...encounteredKeys, ...resolvedValues }
      }

      if (isInitialRender && blockInitialAnimation) {
        shouldAnimateType = false
      }

      /**
       * If this is an inherited prop we want to skip this animation
       * unless the inherited variants haven't changed on this render.
       */
      const willAnimateViaParent = isInherited && variantDidChange
      const needsAnimating = !willAnimateViaParent || handledRemovedValues

      if (shouldAnimateType && needsAnimating) {
        animations.push(
          ...definitionList.map((animation: AnimationDefinition) => {
            const options: VisualElementAnimationOptions = { type }

            /**
             * If we're performing the initial animation, but we're not
             * rendering at the same time as the variant-controlling parent,
             * we want to use the parent's transition to calculate the stagger.
             */
            // calcChildStagger reads parent.enteringChildren off the VE;
            // skip stagger when neither node has one allocated.
            const parentHandle = handle.parent
            const parentVE = parentHandle?.visualElement
            if (
              typeof animation === 'string' &&
              isInitialRender &&
              !willAnimateViaParent &&
              manuallyAnimateOnMount &&
              parentVE
            ) {
              const parentVariant = resolveVariant(
                animation,
                parentHandle.options.variants,
                parentHandle.options.custom,
              )

              if (parentVE.enteringChildren && parentVariant && visualElement) {
                const { delayChildren } = parentVariant.transition || {}
                options.delay = calcChildStagger(
                  parentVE.enteringChildren,
                  visualElement,
                  delayChildren,
                )
              }
            }

            return {
              animation,
              options,
            }
          }),
        )
      }
    }

    /**
     * If there are some removed values that haven't been dealt with,
     * we need to create a new animation that falls back either to the value
     * defined in the style prop, or the last read value.
     */
    if (removedKeys.size) {
      const fallbackAnimation: TargetAndTransition = {}

      /**
       * If the initial prop contains a transition we can use that, otherwise
       * allow the animation function to use the visual element's default.
       */
      if (typeof props.initial !== 'boolean') {
        const initialTransition = resolveVariant(
          Array.isArray(props.initial) ? props.initial[0] : props.initial,
          handle.options.variants,
          handle.options.custom,
        )

        if (initialTransition && initialTransition.transition) {
          fallbackAnimation.transition = initialTransition.transition
        }
      }

      removedKeys.forEach((key) => {
        // When a VE exists, defer to its getBaseTarget which can also read
        // the live DOM. The Solid-side fallback skips that DOM read since
        // our writer keeps inline style current.
        const fallbackTarget = visualElement
          ? visualElement.getBaseTarget(key)
          : getBaseTargetSolidSide(handle, key)

        const mv = handle.getValueRegistry().get(key) ?? visualElement?.getValue(key)
        if (mv) mv.liveStyle = true

        fallbackAnimation[key] = fallbackTarget ?? null
      })

      animations.push({ animation: fallbackAnimation })
    }

    let shouldAnimate = Boolean(animations.length)

    // Suppress the noop initial animation when `initial` isn't distinct
    // from `animate`. ONLY applies to the implicit mount-time call — a
    // gesture firing setActive(...) before mount's animateChanges intends
    // to animate regardless.
    if (
      isInitialRender &&
      changedActiveType === undefined &&
      (props.initial === false || props.initial === props.animate) &&
      !manuallyAnimateOnMount
    ) {
      shouldAnimate = false
    }

    isInitialRender = false

    return shouldAnimate ? animate(animations) : Promise.resolve()
  }

  /**
   * Change whether a certain animation type is active.
   */
  function setActive(type: AnimationType, isActive: boolean) {
    // If the active state hasn't changed, we can safely do nothing here
    if (state[type].isActive === isActive) return Promise.resolve()

    // Propagate to children that inherit (no own value for `type`). Each
    // child's setActive recurses, so we only walk one level here.
    for (const child of handle.children) {
      if (child.options[type] !== undefined) continue
      stateMachines.get(child)?.setActive(type, isActive)
    }

    state[type].isActive = isActive
    const animations = animateChanges(type)

    for (const key in state) {
      state[key].protectedKeys = {}
    }

    return animations
  }

  return {
    animateChanges,
    setActive,
    setAnimateFunction: () => {},
    getState: () => state,
    reset: () => {
      state = createState()
      isInitialRender = true
    },
  }
}

/**
 * Wire the animation state machine to a {@link MotionHandle}.
 *
 * Mount phase queues a microtask that either subscribes to a user-provided
 * AnimationControls or runs the initial `animateChanges()` pass — deferred
 * so non-animation bindings settle first. Update phase re-runs
 * `animateChanges()` on opts changes after the first.
 */
export function createAnimation(
  state: MotionHandle,
  getOpts: () => MotionHandle['options'],
): () => void {
  // The state machine itself runs VE-free, but motion-dom's variant
  // cascade walks `ve.variantChildren` — every participant needs a VE for
  // a parent's animateVariant dispatch to reach children that inherit via
  // context.
  if (!state.ensureVisualElement()) return undefined
  // True for the LazyMotion async path (features arrive after first
  // render). Forwarded so manuallyAnimateOnMount mirrors upstream React's
  // `hasMountedOnce` semantics.
  const featureAttachedAfterMount = state.isMounted()
  if (!stateMachines.has(state)) {
    const machine = createAnimationState(state, featureAttachedAfterMount)
    stateMachines.set(state, machine)
    const ve = state.visualElement
    if (ve) ve.animationState = machine
    // create-motion.ts ships no-op defaults so its import graph stays free
    // of stateMachines/JSAnimation/spring — that subgraph only loads once
    // a feature bundle arrives.
    state.setActive = (name, isActive) => {
      if (name === 'exit' && isActive) state.isExiting = true
      const m = stateMachines.get(state)
      return (
        m?.setActive(name, isActive).then(() => {
          if (name === 'exit' && isActive) state.isExiting = false
        }) ?? Promise.resolve()
      )
    }
    state._replayHook = () => {
      const m = stateMachines.get(state)
      m?.reset()
      m?.animateChanges()
    }
  }
  let unmountControls: (() => void) | undefined

  // Both AnimationControls and label-based animate (motion-dom's
  // animateVariant path) need a VE. Mirror the state machine onto it so
  // motion-dom's internals find the same state.
  const ensureVEForVariantOrControls = (): VisualElement | undefined => {
    const ve = state.ensureVisualElement()
    if (ve && !ve.animationState) {
      ve.animationState = getStateMachine(state)
    }
    return ve
  }

  const updateAnimationControlsSubscription = () => {
    const { animate } = state.options
    if (isAnimationControls(animate)) {
      const ve = ensureVEForVariantOrControls()
      if (!ve) return
      unmountControls?.()
      unmountControls = animate.subscribe(ve)
    }
  }

  const runInitialAnimation = () => {
    if (
      !ownsVariants(state.options) &&
      state.hasPendingInitialParent() &&
      state.options.animate === undefined &&
      state.context.animate
    ) {
      updateAnimationControlsSubscription()
    } else {
      stateMachines.get(state)?.animateChanges()
      updateAnimationControlsSubscription()
    }
  }

  // Defer animateChanges to a microtask so gesture/projection/layout
  // bindings land first.
  queueMicrotask(() => {
    if (state.isMounted()) runInitialAnimation()
  })

  let prevAnimate: unknown
  const runUpdateAnimation = () => {
    const opts = getOpts()
    stateMachines.get(state)?.animateChanges()
    if (opts.animate !== prevAnimate) updateAnimationControlsSubscription()
    prevAnimate = opts.animate
  }

  // Use plain createEffect (not `on(...)`): Solid's `on()` wrapper appears
  // to swallow reactivity when the dep function returns through several
  // layers of getter/spread in this setup.
  let isFirst = true
  createEffect(() => {
    const opts = getOpts()
    if (isFirst) {
      isFirst = false
      prevAnimate = opts.animate
      return
    }
    untrack(runUpdateAnimation)
  })

  // Bridge for create-motion's owner effect to trigger an update without
  // importing the animation engine.
  state._animationUpdateHook = runUpdateAnimation

  return () => {
    stateMachines.get(state)?.reset()
    state._animationUpdateHook = undefined
    unmountControls?.()
    unmountControls = undefined
  }
}
