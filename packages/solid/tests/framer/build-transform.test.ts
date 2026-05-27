import { buildTransform, transformProps } from 'motion-dom'
import { describe, expect, it } from 'vitest'

// Ported from framer-motion's render/html/utils/__tests__/build-transform.test.ts.
describe('framer parity — buildTransform', () => {
  it('identifies transform props', () => {
    expect(transformProps.has('perspective')).toBe(false)
    expect(transformProps.has('transformPerspective')).toBe(true)
    expect(transformProps.has('x')).toBe(true)
    expect(transformProps.has('translateX')).toBe(true)
  })

  it('outputs none when all values are default', () => {
    expect(buildTransform({ x: 0 }, {})).toBe('none')
    expect(buildTransform({ x: '0px' }, {})).toBe('none')
    expect(buildTransform({ rotateX: 0 }, {})).toBe('none')
    expect(buildTransform({ rotateX: '0deg' }, {})).toBe('none')
    expect(
      buildTransform(
        {
          x: 0,
          y: 0,
          scale: 1,
          scaleX: 1,
          scaleY: 1,
          rotate: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          skewX: 0,
          skewY: 0,
        },
        {},
      ),
    ).toBe('none')
  })

  it('outputs transform values in order', () => {
    expect(
      buildTransform({ scale: 2, rotate: '90deg', x: 1, y: '10px', rotateZ: '190deg' }, {}),
    ).toBe('translateX(1px) translateY(10px) scale(2) rotate(90deg) rotateZ(190deg)')
  })

  it('handles transformPerspective and string zero scale values', () => {
    expect(buildTransform({ x: '100px', transformPerspective: '200px' }, {})).toBe(
      'perspective(200px) translateX(100px)',
    )
    expect(buildTransform({ scale: '0' }, {})).toBe('scale(0)')
    expect(buildTransform({ scaleX: '0' }, {})).toBe('scaleX(0)')
    expect(buildTransform({ scaleY: '0' }, {})).toBe('scaleY(0)')
  })

  it('handles transformTemplate', () => {
    expect(
      buildTransform(
        { x: '5px' },
        {},
        ({ x }: { x: string }) => `translateX(${parseFloat(x) * 2}px)`,
      ),
    ).toBe('translateX(10px)')
    expect(
      buildTransform(
        { x: 0, y: 200 },
        {},
        ({ x }: { x: string }, generated) => `translateX(${parseFloat(x) + 10}px) ${generated}`,
      ),
    ).toBe('translateX(10px) translateY(200px)')
  })
})
