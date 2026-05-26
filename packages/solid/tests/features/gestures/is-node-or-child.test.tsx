// Ported from motion/react: packages/framer-motion/src/gestures/__tests__/is-node-or-child.test.tsx
import { cleanup, render } from '@solidjs/testing-library'
import { isNodeOrChild } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(() => cleanup())

describe('isNodeOrChild', () => {
  it('reports parents/children correctly', () => {
    const wrapper = render(() => (
      <div>
        <div data-testid="a">
          <div data-testid="b" />
        </div>
        <div data-testid="c">
          <div data-testid="d" />
        </div>
      </div>
    ))

    const a = wrapper.getByTestId('a')
    const b = wrapper.getByTestId('b')
    const c = wrapper.getByTestId('c')

    expect(isNodeOrChild(a, a)).toBe(true)
    expect(isNodeOrChild(a, b)).toBe(true)
    expect(isNodeOrChild(b, a)).toBe(false)
    expect(isNodeOrChild(c, a)).toBe(false)
  })
})
