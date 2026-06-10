import { addScaleCorrector, Feature, frame, globalProjectionState } from 'motion-dom'
import type { IProjectionNode, MotionNodeOptions } from 'motion-dom'
import { getMotionHandle, type MotionHandle } from '@/core/create-motion'
import type { FeatureDefinition } from '@/features/definitions'
import { defaultScaleCorrector } from './config'
import { isDefined } from '@/types'
import type { Options } from '@/types'

function isHidden(element: HTMLElement) {
  return (
    element.style.display === 'none' ||
    (element.offsetParent === null && window.getComputedStyle(element).position !== 'fixed')
  )
}

// Pending-layout flag mirroring upstream: any layout-affecting state
// change marks a pass, and the next layout/layoutId/drag node triggers
// root.didUpdate().
let hasLayoutUpdate = false

// Snapshot every layout/layoutId node EXCEPT the caller — Solid's
// fine-grained reactivity won't re-run siblings whose accessors didn't
// change, so motion-dom's update() would otherwise see them with no
// snapshot and skip notifyLayoutUpdate.
function willUpdateLayoutTree(root: IProjectionNode | undefined, exclude: IProjectionNode) {
  // FlatTree.forEach types children as WithDepth; cast at the boundary.
  root?.nodes?.forEach((entry) => {
    const node = entry as unknown as IProjectionNode<HTMLElement>
    if (node === exclude) return
    if (node.instance && !node.instance.isConnected) return
    const { layout, layoutId } = node.options
    if (layout || layoutId) {
      node.willUpdate(false)
    }
  })
}

function isLayoutEnabled(options: MotionNodeOptions): boolean {
  // Drag also needs the measure-layout lifecycle (snapshots, didUpdate) —
  // upstream's drag feature definition carries MeasureLayout alongside the
  // gesture for the same reason.
  return Boolean(options.layout || options.layoutId || options.drag)
}

/**
 * Wire layout / shared-layout (layoutId) transitions to a MotionHandle.
 *
 * The implementation owns two extra slots on MotionHandle — getSnapshot and
 * didUpdate — that AnimatePresence and the create-motion lifecycle call into
 * for layout capture and reconciliation (the Solid analogue of React's
 * getSnapshotBeforeUpdate / componentDidUpdate that framer's MeasureLayout
 * rides on). We rebind those slots here so a single handle can have layout
 * behaviour swapped at runtime.
 */
class LayoutFeature extends Feature<Element> {
  private cleanup?: () => void

  mount(): void {
    const state = getMotionHandle(this.node)
    if (!state) return
    this.cleanup = mountLayout(state)
  }

  unmount(): void {
    this.cleanup?.()
    this.cleanup = undefined
  }
}

function mountLayout(state: MotionHandle): () => void {
  let hasMountSettled = false
  // Mirror upstream's `prevProps` arg. Initialise to the current options
  // so the first reactive change compares against an OLD reference of
  // equal layoutDependency, not undefined (which would always be != and
  // falsely trigger willUpdate).
  let prevSnapshotOptions: Options | undefined = state.options

  const updatePrevLead = (projection: NonNullable<typeof state.visualElement.projection>) => {
    const stack = projection.getStack()
    if (stack?.prevLead) {
      // Call willUpdate unconditionally for its root.startUpdate() side
      // effect (sets isUpdating=true, bumps animationId). Without that,
      // the following root.didUpdate() short-circuits and no crossfade
      // kicks off when a new shared-layoutId sibling mounts.
      stack.prevLead.willUpdate()
      hasLayoutUpdate = true
    }
  }

  const didUpdate = () => {
    if (!hasLayoutUpdate) return
    if (state.options.layout || state.options.layoutId || state.options.drag) {
      hasLayoutUpdate = false
      state.visualElement.projection?.root?.didUpdate()
    }
  }

  const getSnapshot = (newOptions: Options, isPresent?: boolean): void => {
    const projection = state.visualElement.projection
    const { drag, layoutDependency, layout, layoutId } = newOptions
    if (!projection || (!layout && !layoutId && !drag)) {
      return
    }

    if (!hasMountSettled) {
      return
    }

    // Mirror upstream's prevProps semantics — layoutDependency compares
    // OLD vs NEW. createComputed passes the OLD options as newOptions, so
    // we compare against the previously-snapshotted options.
    const prevProps = prevSnapshotOptions ?? newOptions
    prevSnapshotOptions = newOptions

    hasLayoutUpdate = true
    willUpdateLayoutTree(projection.root, projection)

    /**
     * If the drag or layoutDependency has changed, or the isPresent has changed, we need to update the snapshot
     */
    if (
      drag ||
      prevProps.layoutDependency !== layoutDependency ||
      layoutDependency === undefined ||
      (isDefined(isPresent) && projection.isPresent !== isPresent)
    ) {
      projection.willUpdate()
    }

    /**
     * If the isPresent has changed, we need to update the projection
     * and promote or relegate the projection accordingly
     */
    if (isDefined(isPresent) && isPresent !== projection.isPresent) {
      projection.isPresent = isPresent
      if (isPresent) {
        projection.promote()
        updatePrevLead(projection)
      } else {
        const promoted = projection.relegate()
        // Force-start the return animation when relegate happens under a
        // blocked root. createInstantLayoutTransition's block, intended to
        // skip the instant commit's animation, also blocks the new lead's
        // animation post-relegate. Unblock and drive the update manually.
        if (promoted && projection.root?.isUpdateBlocked?.()) {
          projection.root.unblockUpdate?.()
          if (!projection.root.isUpdating) projection.root.startUpdate?.()
          projection.root.didUpdate?.()
        }
      }
    }
  }

  addScaleCorrector(defaultScaleCorrector)
  state.getSnapshot = getSnapshot
  state.didUpdate = didUpdate

  // Mount work (run inline since the factory is called once per binding).
  const options = state.options
  const layoutGroup = state.options.layoutGroup
  if (options.layout || options.layoutId) {
    const projection = state.visualElement.projection
    if (options.layoutId) {
      const isPresent = state.element instanceof HTMLElement ? !isHidden(state.element) : true
      projection.isPresent = isPresent
      isPresent ? projection.promote() : projection.relegate()
      updatePrevLead(projection)
    }
    layoutGroup?.group?.add(projection)
    // Mirror upstream MeasureLayout.componentDidMount: a mount after a
    // prior layout pass triggers root.didUpdate so existing layout nodes
    // can shift to accommodate the new sibling. Pairs with the pre-mount
    // sibling snapshot in create-motion.ts. #3169.
    if (globalProjectionState.hasEverUpdated) {
      hasLayoutUpdate = true
    }
    globalProjectionState.hasEverUpdated = true
  }
  didUpdate()

  /**
   * Allow one render frame for the projection tree and ancestor animations
   * to settle before accepting layout snapshots. Solid mounts children
   * before parents, so at this point the projection tree may lack the
   * correct parent link, and ancestor elements may be mid-animation
   * (e.g. scale/position), which would cause incorrect bounding rect
   * measurements and spurious layout deltas.
   */
  frame.postRender(() => {
    hasMountSettled = true
  })

  return () => {
    const lg = state.options.layoutGroup
    const projection = state.visualElement.projection
    if (projection) {
      if (lg?.group && (state.options.layout || state.options.layoutId)) {
        lg.group.remove(projection)
      }
      // when layoutId is set, unmount will update the layout
      if (state.options.layoutId) {
        hasLayoutUpdate = true
      }
      didUpdate()
    }
  }
}

export const layoutFeatureDefinition: FeatureDefinition = {
  isEnabled: isLayoutEnabled,
  Feature: LayoutFeature,
}
