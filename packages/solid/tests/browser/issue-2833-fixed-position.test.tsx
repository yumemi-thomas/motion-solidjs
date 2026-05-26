import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function mount(variant: string) {
  // JSX construction is deferred into the render callback so all the
  // resulting reactive computations are owned by render()'s createRoot.
  // Constructing motion.div outside an owner would warn "computations
  // created outside `createRoot` or `render` will never be disposed".
  return render(() => {
    const child = (
      <div
        id="fixed-child"
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          width: '50px',
          height: '50px',
          background: 'red',
        }}
      />
    )

    let parent: any
    if (variant === 'while-hover') {
      parent = (
        <motion.div id="parent" whileHover={{ scale: 1.1 }}>
          {child}
        </motion.div>
      )
    } else if (variant === 'while-tap') {
      parent = (
        <motion.div id="parent" whileTap={{ scale: 0.9 }}>
          {child}
        </motion.div>
      )
    } else if (variant === 'animate-transform') {
      parent = (
        <motion.div id="parent" animate={{ x: 0, y: 0 }}>
          {child}
        </motion.div>
      )
    } else if (variant === 'initial-transform') {
      parent = (
        <motion.div id="parent" initial={{ scale: 1 }} animate={{ scale: 1 }}>
          {child}
        </motion.div>
      )
    } else {
      parent = <motion.div id="parent">{child}</motion.div>
    }

    return <div style={{ padding: '200px' }}>{parent}</div>
  })
}

describe('position: fixed children inside motion.div (#2833)', () => {
  for (const variant of [
    'plain',
    'while-hover',
    'while-tap',
    'animate-transform',
    'initial-transform',
  ]) {
    it(`motion.div does not establish a containing block (variant=${variant})`, async () => {
      mount(variant)
      await wait(50)

      const parent = document.getElementById('parent') as HTMLElement
      const cs = getComputedStyle(parent)
      expect(cs.transform).toBe('none')
      expect(cs.perspective).toBe('none')
      expect(cs.filter).toBe('none')
      expect(cs.willChange).toBe('auto')

      const fixed = document.getElementById('fixed-child') as HTMLElement
      const rect = fixed.getBoundingClientRect()
      expect(rect.top).toBe(10)
      expect(rect.left).toBe(10)
    })
  }
})
