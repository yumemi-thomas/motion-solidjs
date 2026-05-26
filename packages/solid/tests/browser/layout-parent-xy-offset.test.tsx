import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, createUniqueId, For } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-parent-xy-offset.ts
// — fixture mirrors dev/react/src/tests/layout-parent-xy-offset.tsx.
//
// Regression test for #3244. A layoutId element rendered inside a
// motion.div parent that already has an x/y transform should NOT receive a
// projection-correction transform on initial mount. The upstream test wires
// up a MutationObserver on `<body>` to catch any transient `transform`
// style applied to the `.indicator` inside `#motion-parent` during mount —
// any non-"none" value indicates the bug.
function Tabs() {
  const items = ['a', 'b', 'c', 'd', 'e']
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const uuid = createUniqueId()

  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        height: '64px',
        width: '500px',
        'margin-bottom': '12px',
      }}
    >
      <For each={items}>
        {(item, index) => (
          <div
            onClick={() => setSelectedIndex(index())}
            style={{
              flex: 1,
              'border-radius': '8px',
              position: 'relative',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              background: '#eee',
            }}
          >
            <div style={{ position: 'relative', 'z-index': 1, color: 'white' }}>{item}</div>
            {selectedIndex() === index() ? (
              <motion.div
                layoutId={'selected-' + uuid}
                class="indicator"
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  right: '4px',
                  bottom: '4px',
                  background: '#444ccc',
                  'border-radius': '8px',
                }}
              />
            ) : null}
          </div>
        )}
      </For>
    </div>
  )
}

function App() {
  return (
    <div style={{ padding: '12px' }}>
      <motion.div id="motion-parent" style={{ x: 50, y: 50 }}>
        <div style={{ 'margin-bottom': '12px' }}>Motion (x: 50, y: 50)</div>
        <Tabs />
      </motion.div>
      <div style={{ transform: 'translate3d(50px, 50px, 0)' }}>
        <div style={{ 'margin-bottom': '12px' }}>Transform</div>
        <Tabs />
      </div>
      <div id="result" />
    </div>
  )
}

describe('Layout: nested in motion.div with x/y (#3244)', () => {
  let observer: MutationObserver | undefined
  let projectionTransforms: string[] = []

  beforeEach(() => {
    projectionTransforms = []
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName !== 'style') continue
        const el = m.target as HTMLElement
        if (!el.classList?.contains('indicator')) continue
        const motionParent = document.getElementById('motion-parent')
        if (!motionParent?.contains(el)) continue
        const t = el.style.transform
        if (t && t !== 'none') projectionTransforms.push(t)
      }
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
    })
  })

  afterEach(() => {
    observer?.disconnect()
    observer = undefined
  })

  it('layoutId element inside motion.div with x/y should not get a projection transform on mount', async () => {
    render(() => <App />)
    await wait(500)
    expect(
      projectionTransforms.length,
      `expected no projection transforms but got: ${projectionTransforms.join(', ')}`,
    ).toBe(0)
  })
})
