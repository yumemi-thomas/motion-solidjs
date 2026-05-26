import { render } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { Motion } from '@/components'

describe('press gesture', () => {
  // The auto-tabindex injection happens in `create-motion.ts#getAttrs`
  // at initial-render time, so it lands before motion-dom's press feature
  // would otherwise set it live — the test no longer depends on the
  // happy-dom-blocked `isHTMLElement` path inside motion-dom.
  it('adds tabindex=0 when whileTap is set', () => {
    const wrapper = render(() => <Motion data-testid="motion" whileTap={{ scale: 0.9 }} />)

    const motion = wrapper.getByTestId('motion')
    expect(motion.tabIndex).toBe(0)
  })

  it('does not add tabindex when whileTap is not set', () => {
    const wrapper = render(() => <Motion data-testid="motion" />)

    expect(wrapper.getByTestId('motion').tabIndex).toBe(-1)
  })
})
