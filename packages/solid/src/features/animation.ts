import type { VisualElement } from 'motion-dom'
import { createAnimationState, isAnimationControls } from 'motion-dom'
import { createEffect, untrack } from 'solid-js'
import type { MotionHandle } from '@/motion/create-motion'

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

/**
 * Run `animateChanges` on variant children that inherit `animate` from this
 * node. Solid is fine-grained, so a child component doesn't re-render when a
 * parent's `animate` (read via context) changes — meaning its own animateChanges
 * (which tracks values a parent variant *removed* and applies the fallback)
 * would never run. React triggers it by re-rendering variant children on context
 * change; we mirror that explicitly. Recurses for nested inheritance.
 *
 * Present values are NOT double-animated: the child's own prop is inherited
 * (`prop === context[type]`), so upstream's `willAnimateViaParent` branch skips
 * everything except removed-value fallbacks — motion-dom's animateVariant
 * cascade (with when/stagger orchestration) owns the present values.
 */
function cascadeAnimateChangesToInheritedChildren(handle: MotionHandle): void {
  for (const child of handle.children) {
    if (child.options.animate !== undefined) continue
    child.visualElement?.animationState?.animateChanges()
    cascadeAnimateChangesToInheritedChildren(child)
  }
}

/**
 * Wire motion-dom's animation state machine to a {@link MotionHandle}'s
 * VisualElement.
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
  if (state.options.motionConfig?.isStatic) return undefined

  // The state machine lives on the VE (`ve.animationState`) so motion-dom's
  // variant cascade (animateVariant → variantChildren) drives the same state.
  const ve = state.ensureVisualElement()
  if (!ve) return undefined
  // True ONLY for the LazyMotion async path (features arrive in a later task,
  // after the initial mount window). Eager features bind synchronously inside
  // `attach()` while `isInitialMountPending` is still true, so this is false
  // for them — otherwise it would be true for every component (the ref sets
  // `element` before any feature binds) and wrongly force `manuallyAnimateOnMount`,
  // defeating the `initial={false}` mount-animation suppression. Mirrors upstream
  // React's `hasMountedOnce` branch in use-visual-element.
  const featureAttachedAfterMount = state.isMounted() && !state.isInitialMountPending
  if (!ve.animationState) {
    ve.animationState = createAnimationState(ve)
    // create-motion.ts ships no-op defaults so its import graph stays free
    // of the animation engine — that subgraph only loads once a feature
    // bundle arrives.
    state.setActive = (name, isActive) => {
      if (name === 'exit' && isActive) state.isExiting = true
      // React guarantees the mount pass runs (in an effect) before any user
      // event can fire; our mount pass is deferred to a microtask, so a
      // synchronously-dispatched gesture could otherwise hit upstream's
      // mount-time `initial === animate` suppression with `isInitialRender`
      // still unconsumed. Pull the pass forward — the deferred call becomes
      // a no-op repeat.
      runInitialAnimationOnce()
      const animationState = state.visualElement?.animationState
      return (
        animationState?.setActive(name, isActive).then(() => {
          if (name === 'exit' && isActive) state.isExiting = false
        }) ?? Promise.resolve()
      )
    }
    state._replayHook = () => {
      const animationState = state.visualElement?.animationState
      animationState?.reset()
      animationState?.animateChanges()
    }
  }
  let unmountControls: (() => void) | undefined

  const ensureVEForControls = (): VisualElement | undefined => state.ensureVisualElement()

  const updateAnimationControlsSubscription = () => {
    const { animate } = state.options
    if (isAnimationControls(animate)) {
      const controlsVE = ensureVEForControls()
      if (!controlsVE) return
      unmountControls?.()
      unmountControls = animate.subscribe(controlsVE)
    }
  }

  let initialPassDone = false
  const runInitialAnimationOnce = () => {
    if (initialPassDone || !state.isMounted()) return
    initialPassDone = true
    runInitialAnimation()
  }

  const runInitialAnimation = () => {
    // Upstream computes `manuallyAnimateOnMount = Boolean(parent && parent.current)`
    // at VE construction — in React the parent ref is unattached during the
    // initial tree render, so it's only true for nodes mounted later into an
    // established tree. In Solid the parent element exists immediately, so
    // recompute it here from the handle's mount bookkeeping: a pending initial
    // ancestor means this node is part of a freshly-mounting subtree (the
    // variant-controlling parent will cascade with stagger), not a late mount.
    ve.manuallyAnimateOnMount =
      featureAttachedAfterMount ||
      Boolean(state.parent?.element && !state.hasPendingInitialParent())
    // Always run the mount pass, even when a variant-controlling parent will
    // cascade to this node: upstream's inherited-variant logic turns it into
    // a no-op (`willAnimateViaParent`), and running it consumes
    // `isInitialRender` — which the mount-time `initial === animate`
    // suppression keys off. Skipping it would leave that suppression armed
    // forever and swallow the first gesture-driven `setActive`.
    ve.animationState?.animateChanges()
    updateAnimationControlsSubscription()
  }

  // Defer animateChanges to a microtask so gesture/projection/layout
  // bindings land first, then gate on connection: during CSR route changes
  // the element may still be off-document, and motion-dom's keyframes
  // resolver can't read baseline values from a disconnected element —
  // opacity (and other style-read properties) would stay stuck at their
  // initial. `onConnected` runs immediately when already connected.
  queueMicrotask(() => {
    if (state.isMounted()) state.onConnected(runInitialAnimationOnce)
  })

  let prevAnimate: unknown
  const runUpdateAnimation = () => {
    const opts = getOpts()
    const animateChanged = opts.animate !== prevAnimate
    // When this node's `animate` changes, variant children that inherit it
    // need their own animateChanges to run — Solid won't re-render them on
    // the context change the way React does. Run the children BEFORE this
    // node's dispatch, mirroring React's bottom-up effect order: the child
    // pass marks changed keys as `needsAnimating` (and resets removed
    // values), which is what lets the parent's variant cascade through each
    // child's protected-keys gate.
    if (animateChanged) cascadeAnimateChangesToInheritedChildren(state)
    ve.animationState?.animateChanges()
    if (animateChanged) updateAnimationControlsSubscription()
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
    ve.animationState?.reset()
    state._animationUpdateHook = undefined
    unmountControls?.()
    unmountControls = undefined
  }
}
