import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { MotionConfig, motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function mount(isStatic = false) {
  return render(() => (
    <MotionConfig isStatic={isStatic}>
      <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
        <motion.rect
          height="100"
          width="100"
          x={motionValue(50)}
          y={50}
          data-testid="rotate"
          style={{ rotate: 45 }}
        />
        <motion.rect
          height="100"
          width="100"
          x={50}
          y={200}
          data-testid="scale"
          style={{ scale: 2 }}
        />
        <motion.rect
          height="100"
          width="100"
          x={50}
          y={350}
          data-testid="translate"
          style={{ x: 100 }}
        />
      </svg>
    </MotionConfig>
  ))
}

function assertRects() {
  const rotate = document.querySelector("[data-testid='rotate']") as SVGRectElement
  const r = rotate.getBoundingClientRect()
  expect(Math.round(r.top)).toBe(29)
  expect(Math.round(r.left)).toBe(29)
  expect(Math.round(r.right)).toBe(171)
  expect(Math.round(r.bottom)).toBe(171)

  const scale = document.querySelector("[data-testid='scale']") as SVGRectElement
  const s = scale.getBoundingClientRect()
  expect(s.top).toBe(150)
  expect(s.left).toBe(0)
  expect(s.right).toBe(200)
  expect(s.bottom).toBe(350)

  const translate = document.querySelector("[data-testid='translate']") as SVGRectElement
  const t = translate.getBoundingClientRect()
  expect(t.top).toBe(350)
  expect(t.left).toBe(150)
  expect(t.right).toBe(250)
  expect(t.bottom).toBe(450)
}

describe('SVG', () => {
  it('correctly applies transforms', async () => {
    mount(false)
    await wait(200)
    assertRects()
  })

  it('correctly applies transforms in static mode', async () => {
    mount(true)
    await wait(200)
    assertRects()
  })
})
