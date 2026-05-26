import { render } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

describe('height: auto with border-box', () => {
  it('animates to correct target height when box-sizing is border-box with padding', async () => {
    const { unmount } = render(() => (
      <div style={{ padding: '20px' }}>
        <motion.div
          id="box"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ type: 'tween', ease: 'linear', duration: 1 }}
          style={{
            'box-sizing': 'border-box',
            padding: '20px',
            background: 'blue',
            overflow: 'hidden',
          }}
        >
          <div id="content" style={{ height: '100px', background: 'red' }} />
        </motion.div>
      </div>
    ))

    // 50% into the linear 1s tween — height is interpolating toward the
    // resolved auto target (140px for content+padding, box-sizing:border-box),
    // so > 60 catches the midpoint comfortably.
    await wait(500)
    const el = document.getElementById('box') as HTMLElement
    const height = parseFloat(getComputedStyle(el).height)
    expect(height).toBeGreaterThan(60)
    unmount()
  })
})
