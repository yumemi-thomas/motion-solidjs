import { createSignal, type Accessor } from 'solid-js'
import type { LayoutGroupState } from '@/components/context'
import { injectLayoutGroup, provideLayoutGroup } from '@/components/context'
import { nodeGroup } from 'motion-dom'

/**
 * Props for configuring layout group behavior
 */
export interface LayoutGroupProps {
  /** Optional ID for the layout group */
  id?: string
  /**
   * Controls inheritance of parent group properties:
   * - true: Inherit both id and group
   * - 'id': Only inherit id
   * - 'group': Only inherit group
   */
  inherit?: boolean | 'id' | 'group'
}

function createForceUpdate(): [() => void, Accessor<number>] {
  const [key, setKey] = createSignal(0)
  function forceUpdate() {
    setKey((value) => value + 1)
  }

  return [forceUpdate, key]
}

/**
 * Hook to create and manage a layout group
 * Handles group inheritance, force updates, and context management
 */
export function createLayoutGroupProvider(props: LayoutGroupProps): LayoutGroupState {
  const parentGroup = injectLayoutGroup(null)
  const [forceRender, key] = createForceUpdate()

  const context: LayoutGroupState = {
    id: getGroupId(props, parentGroup),
    group: getGroup(props, parentGroup),
    forceRender,
    key,
  }

  provideLayoutGroup(context)
  return context
}

/**
 * Reads the surrounding `LayoutGroup` context. Returns `{ forceRender }`,
 * which re-measures every layout-animated descendant when called — useful
 * after external mutations (DOM reordering, route changes) that the
 * projection tree wouldn't otherwise notice.
 *
 * @example
 * ```tsx
 * const { forceRender } = createLayoutGroup()
 *
 * onMount(() => {
 *   subscribeToExternalLayoutChange(forceRender)
 * })
 * ```
 */
export function createLayoutGroup() {
  const { forceRender } = injectLayoutGroup({ forceRender: () => {} })
  return { forceRender }
}

/**
 * Determines the group ID based on inheritance rules
 */
function getGroupId(props: LayoutGroupProps, parentGroup: LayoutGroupState | null) {
  const shouldInherit = props.inherit === true || props.inherit === 'id'
  const parentId = parentGroup?.id

  if (shouldInherit && parentId) {
    return props.id ? `${parentId}-${props.id}` : parentId
  }
  return props.id
}

/**
 * Creates or inherits a node group based on inheritance rules
 */
function getGroup(props: LayoutGroupProps, parentGroup: LayoutGroupState | null) {
  const shouldInherit = props.inherit === true || props.inherit === 'group'
  return shouldInherit ? parentGroup?.group || nodeGroup() : nodeGroup()
}
