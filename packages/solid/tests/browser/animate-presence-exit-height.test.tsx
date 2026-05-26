import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, MotionConfig, motion } from '@/components'
import { getEl, wait } from './helpers'

// Port of motion-upstream/packages/framer-motion/cypress/integration/animate-presence-exit-height.ts
// Fixture: motion-upstream/dev/react/src/tests/animate-presence-exit-height.tsx
//
// Three-item accordion driving height-`auto` <-> 0 with a linear tween.
// The upstream cypress fixture uses a 10s duration; we use 1s here so
// the suite runs in ~3s instead of ~21s. All mid-flight waits below are
// kept at 20% of the duration (proportional to the original timings) so
// the "still animating" assertions remain just as reliable.
const DURATION = 1

afterEach(() => cleanup())

const items = [
  { id: 'a', title: 'Item A', content: 'Content for item A' },
  { id: 'b', title: 'Item B', content: 'Content for item B' },
  { id: 'c', title: 'Item C', content: 'Content for item C' },
]

function setup() {
  const [openId, setOpenId] = createSignal<string | null>('a')
  return {
    open: openId,
    setOpen: setOpenId,
    ...render(() => (
      <MotionConfig transition={{ type: 'tween', ease: 'linear', duration: DURATION }}>
        <div id="accordion" style={{ width: '400px' }}>
          <For each={items}>
            {(item) => (
              <div>
                <button
                  class="trigger"
                  data-id={item.id}
                  onClick={() => setOpenId(openId() === item.id ? null : item.id)}
                >
                  {item.title}
                </button>
                <AnimatePresence initial={false}>
                  <Show when={openId() === item.id}>
                    <motion.div
                      class="panel"
                      data-panel={item.id}
                      variants={{
                        open: { height: 'auto', opacity: 1 },
                        closed: { height: 0, opacity: 0 },
                      }}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      style={{ overflow: 'hidden' }}
                      transition={{
                        type: 'tween',
                        ease: 'linear',
                        duration: DURATION,
                      }}
                    >
                      <div style={{ padding: '20px' }}>{item.content}</div>
                    </motion.div>
                  </Show>
                </AnimatePresence>
              </div>
            )}
          </For>
        </div>
      </MotionConfig>
    )),
  }
}

const panelHeight = (id: string) =>
  parseFloat(getComputedStyle(getEl(`[data-panel="${id}"]`)).height)

// Proportional timings — 20% of duration is "mid-flight", duration+200ms
// is "well past the end". Originals were wait(2000)/wait(11000) against a
// 10s duration; same ratios against DURATION here.
const MID = DURATION * 1000 * 0.2
const PAST_END = DURATION * 1000 + 200
const PRE_INTERRUPT = DURATION * 1000 * 0.05

describe('AnimatePresence exit with height', () => {
  it('exit animation is not instant when closing an accordion item', async () => {
    setup()
    await wait(50)
    getEl('[data-id="a"]').click()
    // 20% into the linear exit — panel A should still be rendered with
    // a non-zero height.
    await wait(MID)
    expect(panelHeight('a')).toBeGreaterThan(0)
  })

  it('exit animation eventually removes the element', async () => {
    setup()
    await wait(50)
    getEl('[data-id="a"]').click()
    // Past the full exit + buffer for AnimatePresence's safe-to-remove.
    await wait(PAST_END)
    expect(document.querySelector('[data-panel="a"]')).toBeNull()
  })

  it('opening a new item while another exits animates both', async () => {
    setup()
    await wait(50)
    // Click B — closes A, opens B; both panels should be visible and
    // mid-animation.
    getEl('[data-id="b"]').click()
    await wait(MID)
    expect(panelHeight('a')).toBeGreaterThan(0)
    expect(panelHeight('b')).toBeGreaterThan(0)
  })

  it('interrupting enter animation does not break exit animation', async () => {
    setup()
    await wait(50)
    // Open B (starts enter), then immediately re-click to interrupt and
    // start its exit while still mid-enter.
    getEl('[data-id="b"]').click()
    await wait(PRE_INTERRUPT)
    getEl('[data-id="b"]').click()
    // Mid-flight on the exit — panel B should still be rendered, not snapped.
    await wait(MID)
    expect(panelHeight('b')).toBeGreaterThan(0)
  })

  it('switching items mid-enter animates the exit', async () => {
    setup()
    await wait(50)
    // Open B (mid-enter), then switch to C — B should now exit while C
    // enters. Both panels are still in-flight.
    getEl('[data-id="b"]').click()
    await wait(PRE_INTERRUPT)
    getEl('[data-id="c"]').click()
    await wait(MID)
    expect(panelHeight('b')).toBeGreaterThan(0)
    expect(panelHeight('c')).toBeGreaterThan(0)
  })
})
