import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { Motion } from '@/components'
import { mountedStates } from '@/motion/create-motion'

afterEach(() => {
  cleanup()
})

describe('Motion tree', () => {
  it('registers each mounted visual element once', async () => {
    const getNodeId = (node: { props: unknown }) => (node.props as { id?: string }).id

    render(() => (
      <Motion id="parent" initial="hidden" animate="visible" variants={{ visible: {} }}>
        <Motion id="wrapper">
          <Motion id="child" variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }} />
        </Motion>
      </Motion>
    ))

    await new Promise((resolve) => setTimeout(resolve, 50))

    const parent = mountedStates.get(document.getElementById('parent')!)
    const wrapper = mountedStates.get(document.getElementById('wrapper')!)
    const child = mountedStates.get(document.getElementById('child')!)

    expect(parent).toBeDefined()
    expect(wrapper).toBeDefined()
    expect(child).toBeDefined()
    expect(wrapper?.parent).toBe(parent)
    expect(child?.parent).toBe(wrapper)
    // The VE constructor sets `manuallyAnimateOnMount = Boolean(parent.current)`,
    // which in Solid is true even during a fresh tree mount (parent elements
    // exist before children bind, unlike React's unattached refs). The
    // animation feature recomputes it at mount-pass time from the handle's
    // mount bookkeeping: nodes in a freshly-mounting subtree get `false`
    // (the variant-controlling parent cascades to them, with stagger),
    // matching React's initial-render semantics.
    expect(child?.visualElement.manuallyAnimateOnMount).toBe(false)
    expect(Array.from(parent?.visualElement.children ?? []).map(getNodeId)).toEqual(['wrapper'])
    expect(Array.from(parent?.visualElement.variantChildren ?? []).map(getNodeId)).toEqual([
      'child',
    ])
  })
})
