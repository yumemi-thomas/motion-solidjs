import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { cyDrag, nextFrame } from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

afterEach(() => {
  window.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// drag-layout-reorder-strict.ts — #3169: dragging a memoized item while
// content is inserted above (via a folder expand) should keep the
// dragged item at its on-screen position.
//
// IMPL GAP: relies on layout projection (every layout-affecting node
// uses `layout`, and the fix depends on projection's drag compensation
// continuing to work when a sibling didn't get willUpdate()). Layout
// projection is not yet wired in the Solid port (see
// _layout-projection.test.ts), so the assertion that File1's top stays
// near its pre-expand position must fail.

function mount() {
  const [folderHoveredId, setFolderHoveredId] = createSignal<string | null>(null)
  const [expanded, setExpanded] = createSignal(new Set(['Folder2']))

  // Expose for the test to drive
  ;(window as Window & { hoverFolder?: (name: string | null) => void }).hoverFolder = (name) => {
    setFolderHoveredId(name)
  }
  ;(window as Window & { expandFolder?: (name: string) => void }).expandFolder = (name) => {
    setExpanded((prev) => new Set([...prev, name]))
  }

  return render(() => (
    <div style={{ padding: '50px', width: '300px' }}>
      <For each={['Folder1', 'Folder2', 'Folder3']}>
        {(folderName) => (
          <div style={{ 'margin-bottom': '2px' }}>
            <motion.div
              layout
              data-testid={`folder-title-${folderName}`}
              style={{
                padding: '8px 10px',
                background: folderHoveredId() === folderName ? '#555' : '#333',
                color: 'white',
              }}
            >
              {expanded().has(folderName) ? '▼' : '▶'} {folderName}
            </motion.div>
            <Show when={folderName === 'Folder1' && expanded().has('Folder1')}>
              <For each={['Existing1a', 'Existing1b', 'Existing1c']}>
                {(name) => (
                  <motion.div
                    layout
                    data-testid={`placeholder-${name}`}
                    style={{
                      height: '35px',
                      background: '#666',
                      color: 'white',
                      display: 'flex',
                      'align-items': 'center',
                      padding: '0 20px',
                      'margin-bottom': '2px',
                    }}
                  >
                    {name}
                  </motion.div>
                )}
              </For>
            </Show>
            <Show when={folderName === 'Folder2' && expanded().has('Folder2')}>
              <For each={['File1', 'File2', 'File3']}>
                {(name) => (
                  <motion.div
                    data-testid={`file-${name}`}
                    drag="y"
                    layout
                    dragMomentum={false}
                    dragSnapToOrigin
                    whileTap={{ scale: 1.05 }}
                    style={{
                      height: '35px',
                      background: '#0099ff',
                      color: 'white',
                      display: 'flex',
                      'align-items': 'center',
                      padding: '0 20px',
                      'margin-bottom': '2px',
                    }}
                  >
                    {name}
                  </motion.div>
                )}
              </For>
            </Show>
          </div>
        )}
      </For>
      <div id="result" data-hovered={folderHoveredId() ?? ''} />
    </div>
  ))
}

describe('Drag layout reorder in StrictMode', () => {
  // BLOCKED: depends on layout projection's drag compensation.
  it('Maintains drag position when content is inserted above (memoized component)', async () => {
    const wrapper = mount()
    await wait(200)

    const file = wrapper.getByTestId('file-File1')
    const pointer = cyDrag(file, 100, 15)
    await wait(50)
    await pointer.to(100, 20)
    await wait(50)
    await pointer.to(100, 80)
    await wait(200)

    const preExpandTop = file.getBoundingClientRect().top
    ;(window as Window & { expandFolder?: (name: string) => void }).expandFolder?.('Folder1')
    await wait(500)

    expect(wrapper.queryByTestId('placeholder-Existing1a')).not.toBeNull()

    const postExpandTop = file.getBoundingClientRect().top
    expect(postExpandTop).toBeGreaterThan(preExpandTop - 50)
    expect(postExpandTop).toBeLessThan(preExpandTop + 50)

    pointer.end()
    await nextFrame()
  })

  // Hovering Folder3 only changes its background color — no DOM nodes
  // are inserted between File1 and the top of the viewport, so the
  // dragged file's position naturally stays in place. The regression
  // this test catches (issue #3169) only manifests when the layout
  // SHIFTS during drag, which happens in the sibling test that expands
  // a folder above File1.
  it('Maintains drag position on simple hover state change', async () => {
    const wrapper = mount()
    await wait(200)

    const file = wrapper.getByTestId('file-File1')
    const pointer = cyDrag(file, 100, 15)
    await wait(50)
    await pointer.to(100, 20)
    await wait(50)
    await pointer.to(100, 80)
    await wait(200)

    const preHoverTop = file.getBoundingClientRect().top
    ;(window as Window & { hoverFolder?: (name: string | null) => void }).hoverFolder?.('Folder3')
    await wait(300)

    const postHoverTop = file.getBoundingClientRect().top
    expect(postHoverTop).toBeGreaterThan(preHoverTop - 30)
    expect(postHoverTop).toBeLessThan(preHoverTop + 30)

    pointer.end()
    await nextFrame()
  })
})
