import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { Motion } from '@/components'
import { delay } from '#tests/utils'

afterEach(() => {
  cleanup()
})

/**
 * Mock :focus-visible on an element.
 * Happy-dom returns false for :focus-visible on programmatic focus,
 * but in real browsers keyboard-triggered focus would match.
 */
function mockFocusVisible(el: Element) {
  const origMatches = el.matches.bind(el)
  Object.defineProperty(el, 'matches', {
    configurable: true,
    value: (selector: string) => (selector === ':focus-visible' ? true : origMatches(selector)),
  })
}

describe('focus behavior', () => {
  it('should trigger whileFocus when element receives focus', async () => {
    const wrapper = render(() => (
      <Motion
        whileFocus={{ scale: 1.2, boxShadow: '0 0 0 2px #ff0088' }}
        transition={{ duration: 0 }}
        data-testid="motion"
      />
    ))

    const el = wrapper.getByTestId('motion')
    mockFocusVisible(el)
    await delay(0)
    fireEvent.focus(el)
    await delay(50)
    expect(el.style.transform).toBe('scale(1.2)')
    expect(el.style.boxShadow).toBe('0 0 0 2px #ff0088')

    fireEvent.blur(el)
    await delay(50)
    expect(el.style.transform).toBe('none')
    expect(el.style.boxShadow).not.toBe('0 0 0 2px #ff0088')
  })
})
