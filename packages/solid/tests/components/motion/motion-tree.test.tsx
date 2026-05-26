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
    // Post C4-a, VEs are constructed lazily during feature bind (post-mount),
    // so a child's VE sees `parent.current` already set and motion-dom's
    // `manuallyAnimateOnMount` flag flips to `true`. That's semantically
    // correct for Solid's top-down render: by the time the child exists as
    // a VE, the parent's variantChildren cascade has already run, so the
    // child needs to fire its own animation. The test below asserts the
    // user-facing behavior (parent.variantChildren still includes the
    // child) holds either way.
    expect(child?.visualElement.manuallyAnimateOnMount).toBe(true)
    expect(Array.from(parent?.visualElement.children ?? []).map(getNodeId)).toEqual(['wrapper'])
    expect(Array.from(parent?.visualElement.variantChildren ?? []).map(getNodeId)).toEqual([
      'child',
    ])
  })
})
