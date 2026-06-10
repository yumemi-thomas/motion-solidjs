import { createAnimationState, Feature, isAnimationControls } from 'motion-dom'
import type { MotionNodeOptions } from 'motion-dom'
import { getMotionHandle, type MotionHandle } from '@/motion/create-motion'

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

/** Mirrors framer's `featureProps.animation` isEnabled list. */
export function isAnimationEnabled(options: MotionNodeOptions): boolean {
  return Boolean(
    options.animate ||
    options.variants ||
    options.whileHover ||
    options.whileTap ||
    options.exit ||
    options.whileInView ||
    options.whileFocus ||
    options.whileDrag,
  )
}

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
 * Wire motion-dom's animation state machine to the VisualElement.
 *
 * Mount runs the initial `animateChanges()` pass via a connection-gated
 * microtask (or subscribes a user-provided AnimationControls); `update()` —
 * driven by create-motion's central feature pass on option changes —
 * re-runs `animateChanges()` and cascades to inherited variant children.
 */
export class AnimationFeature extends Feature<Element> {
  private unmountControls?: () => void
  private prevAnimate: unknown
  private initialPassDone = false
  private isStatic = false

  mount(): void {
    const state = getMotionHandle(this.node)
    if (!state) return
    if (state.options.motionConfig?.isStatic) {
      this.isStatic = true
      return
    }
    const ve = this.node
    // True ONLY for the LazyMotion async path (features arrive in a later task,
    // after the initial mount window). Eager features mount synchronously inside
    // `attach()` while `isInitialMountPending` is still true, so this is false
    // for them — otherwise it would be true for every component (the ref sets
    // `element` before any feature mounts) and wrongly force `manuallyAnimateOnMount`,
    // defeating the `initial={false}` mount-animation suppression. Mirrors upstream
    // React's `hasMountedOnce` branch in use-visual-element.
    const featureAttachedAfterMount = state.isMounted() && !state.isInitialMountPending
    if (!ve.animationState) {
      ve.animationState = createAnimationState(ve)
    }
    this.prevAnimate = state.options.animate

    const runInitialAnimationOnce = () => {
      if (this.initialPassDone || !state.isMounted()) return
      this.initialPassDone = true
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
      this.updateAnimationControlsSubscription()
    }

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

    // Defer animateChanges to a microtask so gesture/projection/layout
    // features settle first, then gate on connection: during CSR route
    // changes the element may still be off-document, and motion-dom's
    // keyframes resolver can't read baseline values from a disconnected
    // element — opacity (and other style-read properties) would stay stuck
    // at their initial. `onConnected` runs immediately when already connected.
    queueMicrotask(() => {
      if (state.isMounted()) state.onConnected(runInitialAnimationOnce)
    })
  }

  private updateAnimationControlsSubscription(): void {
    const state = getMotionHandle(this.node)
    if (!state) return
    const { animate } = state.options
    if (isAnimationControls(animate)) {
      const ve = state.ensureVisualElement()
      if (!ve) return
      this.unmountControls?.()
      this.unmountControls = animate.subscribe(ve)
    }
  }

  update(): void {
    if (this.isStatic) return
    const state = getMotionHandle(this.node)
    if (!state) return
    const animateChanged = state.options.animate !== this.prevAnimate
    // When this node's `animate` changes, variant children that inherit it
    // need their own animateChanges to run — Solid won't re-render them on
    // the context change the way React does. Run the children BEFORE this
    // node's dispatch, mirroring React's bottom-up effect order: the child
    // pass marks changed keys as `needsAnimating` (and resets removed
    // values), which is what lets the parent's variant cascade through each
    // child's protected-keys gate.
    if (animateChanged) cascadeAnimateChangesToInheritedChildren(state)
    this.node.animationState?.animateChanges()
    if (animateChanged) this.updateAnimationControlsSubscription()
    this.prevAnimate = state.options.animate
  }

  unmount(): void {
    this.node.animationState?.reset()
    this.unmountControls?.()
    this.unmountControls = undefined
  }
}
