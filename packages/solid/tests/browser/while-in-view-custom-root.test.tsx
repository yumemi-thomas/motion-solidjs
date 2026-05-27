import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

// Port of motion-upstream/dev/react/src/tests/while-in-view-custom-root.tsx.
describe('whileInView custom root', () => {
  it('observes visibility against the provided root element', async () => {
    let containerRef!: HTMLDivElement

    render(() => (
      <div
        id="container"
        ref={(el) => (containerRef = el)}
        style={{ width: '300px', overflow: 'scroll', display: 'flex' }}
      >
        <div style={{ flex: '0 0 400px' }} />
        <motion.div
          id="box"
          initial={false}
          transition={{ duration: 0.01 }}
          animate={{ background: 'rgba(255,0,0,1)' }}
          whileInView={{ background: 'rgba(0,255,0,1)' }}
          viewport={{ root: containerRef }}
          style={{ width: '100px', height: '100px', 'flex-shrink': 0 }}
        />
      </div>
    ))

    await wait(50)
    expect(getHTMLElement('box').style.backgroundColor).toBe('rgb(255, 0, 0)')

    containerRef.scrollLeft = 250
    containerRef.dispatchEvent(new Event('scroll'))
    await wait(100)

    expect(getHTMLElement('box').style.backgroundColor).toBe('rgb(0, 255, 0)')
  })
})
