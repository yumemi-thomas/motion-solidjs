import { render } from '@solidjs/testing-library'
import { createSignal, type JSX } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

describe('CSS variables', () => {
  it('Numerical CSS var values are resolved and animated correctly', async () => {
    let isFirstFrame = true
    const [content, setContent] = createSignal('')

    // Solid's JSX.CSSProperties index signature `[key: \`-${string}\`]: ...`
    // permits `--*` custom properties, so the contextual annotation is all
    // we need — no widening cast.
    const cssVars: JSX.CSSProperties = {
      '--a': '#00F',
      '--b': '100px',
      '--c': '2',
      '--d': '0.5',
    }

    const { unmount } = render(() => (
      <div style={cssVars}>
        <motion.div
          animate={{
            originX: 0,
            originY: 0,
            opacity: 'var(--d)',
            backgroundColor: ' var(--a)',
            scale: 'var(--c)',
            x: 'var(--b)',
          }}
          transition={{ duration: 0.1 }}
          style={{
            width: '100px',
            height: '100px',
            'background-color': '#f00',
            'border-radius': '20px',
          }}
          onUpdate={({ scale }) => {
            if (isFirstFrame) {
              setContent(typeof scale === 'string' ? 'Fail' : 'Success')
            }
            isFirstFrame = false
          }}
          id="test"
        >
          {content()}
        </motion.div>
      </div>
    ))

    await wait(200)
    const el = document.getElementById('test') as HTMLElement
    expect(el.textContent).toBe('Success')
    unmount()
  })
})
