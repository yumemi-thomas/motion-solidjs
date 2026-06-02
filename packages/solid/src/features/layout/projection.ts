import type { IProjectionNode } from 'motion-dom'
import {
  HTMLProjectionNode,
  addScaleCorrector,
  globalProjectionState,
  rootProjectionNode,
} from 'motion-dom'
import { createEffect } from 'solid-js'
import { getClosestProjectingNode } from '@/features/layout/utils'
import { defaultScaleCorrector } from '@/features/layout/config'
import type { MotionHandle } from '@/motion/create-motion'
import { setRootProjectionUpdater } from '@/motion/root-projection-update'
import { isHTMLElement, isSSR } from '@/utils/is'

// Lets the core handle request a root update on a new layout/drag node without
// itself importing `rootProjectionNode` (which drags in the whole projection +
// animation engine — kept out of bare `m`). Registered from inside
// `createProjection` rather than at module top level so it survives the
// package's `sideEffects: false` (a bare top-level call could be tree-shaken).
// Timing is safe: the root can't have `hasEverUpdated` until a projection node
// has been created, which only happens once `createProjection` has run.
let rootUpdaterRegistered = false
function ensureRootProjectionUpdater() {
  if (rootUpdaterRegistered) return
  rootUpdaterRegistered = true
  setRootProjectionUpdater(() => {
    if (
      globalProjectionState.hasEverUpdated &&
      rootProjectionNode.current &&
      !rootProjectionNode.current.isUpdating
    ) {
      rootProjectionNode.current.startUpdate()
    }
  })
}

/**
 * Wire motion-dom's HTMLProjectionNode to a MotionHandle — the layer that
 * drives shared-layout transitions and reads/writes element bounding boxes
 * for layout/layoutId/drag.
 *
 * Mounts the projection synchronously, then re-applies setOptions whenever
 * the layout-related opts change.
 */
export function createProjection(
  state: MotionHandle,
  getOpts: () => MotionHandle['options'],
): () => void {
  // HTMLProjectionNode anchors to ve.latestValues and walks the VE parent
  // chain, so projection always needs a VE.
  if (!state.ensureVisualElement()) return undefined
  ensureRootProjectionUpdater()
  let projection: IProjectionNode | undefined

  const setOptions = () => {
    const options = state.options
    const { layoutId, layout, drag = false, dragConstraints = false } = options
    // Treat any ref-form constraint (Element or accessor returning one) as
    // requiring continuous layout measurement so the constraint box stays
    // in sync with the layout.
    const isRefConstraint =
      typeof dragConstraints === 'function' ||
      (Boolean(dragConstraints) && isHTMLElement(dragConstraints))
    projection?.setOptions({
      layout,
      layoutId,
      alwaysMeasureLayout: Boolean(layoutId) || Boolean(drag) || isRefConstraint,
      visualElement: state.visualElement,
      animationType: typeof options.layout === 'string' ? options.layout : 'both',
      // initialPromotionConfig
      layoutRoot: options.layoutRoot,
      layoutScroll: options.layoutScroll,
      layoutAnchor: options.layoutAnchor,
      crossfade: options.crossfade,
      // No-op: layout-exit completion is observed via the Presence
      // registry now (runExit awaits setActive('exit', true)'s promise).
      onExitComplete: () => {},
    })
  }

  const initProjection = () => {
    const options = state.options
    state.visualElement.projection = new HTMLProjectionNode(
      state.visualElement.latestValues,
      options['data-framer-portal-id']
        ? undefined
        : getClosestProjectingNode(state.visualElement.parent),
    )
    projection = state.visualElement.projection
    projection.isPresent = true
    setOptions()
    // Guard against transient DOM detachment.
    // @solid-primitives/transition-group briefly detaches the entering
    // element during AnimatePresence mode="wait" out→in swaps. Scheduled
    // update() during that window measures (0,0,0,0) and emits a spurious
    // LayoutMeasure event. React's commit-phase semantics avoid this, so
    // motion-react doesn't need the guard.
    const origUpdateLayout = projection.updateLayout.bind(projection)
    projection.updateLayout = () => {
      const el = state.element
      if (el && !el.isConnected) {
        return
      }
      return origUpdateLayout()
    }
  }

  addScaleCorrector(defaultScaleCorrector)
  if (!isSSR) {
    initProjection()
    projection?.mount(state.element)
    // During CSR route changes Solid builds the subtree off-document before
    // inserting it, so every layout measurement scheduled in the mount window
    // is skipped by the `updateLayout` guard above and never retried once
    // connected. Layout callbacks (`onLayoutMeasure`, which Reorder uses to
    // register item positions) then never fire. If we mounted while detached,
    // force a measurement once the element connects.
    if (state.element && !state.element.isConnected) {
      state.onConnected(() => {
        if (!projection) return
        projection.isLayoutDirty = true
        projection.updateLayout()
      })
    }
  }

  createEffect(() => {
    // Touch the opts to subscribe; setOptions reads via state.options.
    getOpts()
    if (projection) setOptions()
  })

  return () => {
    // Projection cleanup happens in motion-dom on VE unmount.
  }
}
