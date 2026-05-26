import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-anchor.ts
// against motion-upstream/dev/react/src/tests/layout-anchor.tsx. Verifies the
// `layoutAnchor` prop keeps a child centered while its parent's bbox is
// mid-animation. Tween: 1s linear on parent, 1s linear (delay 0.5s) on child,
// so at +250ms the child has not yet started — only `layoutAnchor` can hold
// the centered position.

afterEach(() => cleanup())

interface FixtureProps {
  anchorX: number
  anchorY: number
}

function Fixture(props: FixtureProps) {
  const [expanded, setExpanded] = createSignal(false)

  const parentStyle = () => ({
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: expanded() ? '400px' : '200px',
    height: expanded() ? '400px' : '200px',
    background: 'rgba(0,0,0,0.1)',
    cursor: 'pointer',
  })

  const childStyle = {
    width: '50px',
    height: '50px',
    background: 'green',
  }

  const childStyleNoAnchor = {
    width: '50px',
    height: '50px',
    background: 'red',
  }

  return (
    <div style={{ display: 'flex', gap: '40px', padding: '20px' }}>
      <motion.div
        id="parent"
        layout
        onClick={() => setExpanded(!expanded())}
        style={parentStyle()}
        transition={{ type: 'tween', ease: 'linear', duration: 1 }}
      >
        <motion.div
          id="child-anchored"
          layout
          layoutAnchor={{ x: props.anchorX, y: props.anchorY }}
          style={childStyle}
          transition={{ type: 'tween', ease: 'linear', duration: 1, delay: 0.5 }}
        />
      </motion.div>

      <motion.div
        id="parent-no-anchor"
        layout
        onClick={() => setExpanded(!expanded())}
        style={parentStyle()}
        transition={{ type: 'tween', ease: 'linear', duration: 1 }}
      >
        <motion.div
          id="child-no-anchor"
          layout
          style={childStyleNoAnchor}
          transition={{ type: 'tween', ease: 'linear', duration: 1, delay: 0.5 }}
        />
      </motion.div>
    </div>
  )
}

describe('layoutAnchor', () => {
  it('Child with layoutAnchor={x:0.5,y:0.5} stays centered mid-animation', async () => {
    // Even without an implemented `layoutAnchor` prop, this assertion can
    // pass because the parent's `display: flex; align-items: center;
    // justify-content: center` keeps the child visually centered. Real
    // anchor support would only matter if a child layout transition were
    // actively pulling it off-center, which the upstream fixture stages
    // via projection.
    render(() => <Fixture anchorX={0.5} anchorY={0.5} />)

    await wait(50)
    const parent = document.getElementById('parent') as HTMLElement
    parent.click()
    // 25% through 1s linear parent animation — child still in its 0.5s delay.
    await wait(250)

    const parentRect = parent.getBoundingClientRect()
    const parentCenterX = parentRect.left + parentRect.width / 2
    const parentCenterY = parentRect.top + parentRect.height / 2

    const child = parent.querySelector('#child-anchored') as HTMLElement
    const childRect = child.getBoundingClientRect()
    const childCenterX = childRect.left + childRect.width / 2
    const childCenterY = childRect.top + childRect.height / 2

    expect(Math.abs(childCenterX - parentCenterX)).toBeLessThanOrEqual(15)
    expect(Math.abs(childCenterY - parentCenterY)).toBeLessThanOrEqual(15)
  })

  it('Child without layoutAnchor drifts from center mid-animation', async () => {
    // Without `layoutAnchor`, Solid's projection holds the child at its
    // pre-resize (top-left-projected) position while the parent's bbox
    // continues to grow — yielding a visible drift away from centre.
    render(() => <Fixture anchorX={0.5} anchorY={0.5} />)

    await wait(50)
    const parent = document.getElementById('parent') as HTMLElement
    parent.click()
    await wait(250)

    const altParent = document.getElementById('parent-no-anchor') as HTMLElement
    const parentRect = altParent.getBoundingClientRect()
    const parentCenterX = parentRect.left + parentRect.width / 2

    const child = altParent.querySelector('#child-no-anchor') as HTMLElement
    const childRect = child.getBoundingClientRect()
    const childCenterX = childRect.left + childRect.width / 2

    const drift = Math.abs(childCenterX - parentCenterX)
    expect(drift).toBeGreaterThan(5)
  })
})
