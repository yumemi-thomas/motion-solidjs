import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

function supportsOklch() {
  const el = document.createElement('div')
  el.style.backgroundColor = 'oklch(0.5 0.1 200)'
  return el.style.backgroundColor !== ''
}

// Color check that accepts the three forms modern browsers can return for
// an animated oklch target: a literal `oklch(L C H)` (Chromium 116+ keeps
// it as-is), an `rgb(r,g,b)` (older browsers that resolved it), and an
// `rgba(r,g,b,a)` (browsers that interpolate through rgba). All forms must
// represent the same blue-ish target (`oklch(0.65 0.18 260)` ≈
// rgb(71,150,210)).
function assertBlueish(computed: string) {
  const oklchMatch = computed.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\)/)
  if (oklchMatch) {
    const [, l, c, h] = oklchMatch
    expect(Number(l)).toBeCloseTo(0.65, 1)
    expect(Number(c)).toBeCloseTo(0.18, 1)
    expect(Number(h)).toBeCloseTo(260, 0)
    return
  }
  const rgbMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
  expect(rgbMatch, `computed value not in oklch/rgb form: ${computed}`).not.toBeNull()
  const [, r, g, b] = rgbMatch!
  expect(Number(r)).toBeLessThan(120)
  expect(Number(g)).toBeGreaterThan(100)
  expect(Number(b)).toBeGreaterThan(180)
}

describe('oklch color animation', () => {
  it('animates to the correct oklch target color', async () => {
    const [active, setActive] = createSignal(false)
    const [result, setResult] = createSignal('')

    const { unmount } = render(() => (
      <div style={{ padding: '20px' }}>
        <button id="toggle" onClick={() => setActive(!active())}>
          Toggle color
        </button>
        <motion.div
          id="box"
          animate={{
            backgroundColor: active() ? 'oklch(0.65 0.18 260)' : '#ffffff',
          }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.5 }}
          onAnimationComplete={() => {
            const el = document.getElementById('box')
            if (el) {
              setResult(
                JSON.stringify({
                  computed: getComputedStyle(el).backgroundColor,
                  supportsOklch: supportsOklch(),
                }),
              )
            }
          }}
          style={{
            width: '100px',
            height: '100px',
            'background-color': '#ffffff',
          }}
        />
        <div id="result">{result()}</div>
      </div>
    ))

    await wait(200)
    // Clear any result emitted by the initial animation, then click.
    setResult('')
    ;(document.getElementById('toggle') as HTMLButtonElement).click()
    // wait for the post-click animation to land and onAnimationComplete to fire
    let text = ''
    for (let i = 0; i < 30; i++) {
      await wait(100)
      text = document.getElementById('result')!.textContent ?? ''
      if (text !== '') break
    }
    expect(text).not.toBe('')
    const data = JSON.parse(text)
    if (data.supportsOklch) {
      assertBlueish(data.computed)
    } else {
      expect(data.computed).toMatch(/^rgb/)
    }
    unmount()
  })
})
