import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { createInView } from '@/primitives/create-in-view'

// Construction-time behaviour. IntersectionObserver enter/leave semantics
// are covered by browser-mode (`tests/browser/while-in-view.test.tsx`) —
// happy-dom can't run them because its DOM elements aren't `instanceof
// EventTarget`, so `motion`'s `resolveElements` returns an empty list and
// `observer.observe` never fires.

function renderInView(opts?: { initial?: boolean; once?: boolean }) {
  const [el, setEl] = createSignal<HTMLDivElement | undefined>(undefined)
  let isInView!: () => boolean
  render(() => {
    isInView = createInView(el, opts)
    return <div ref={setEl} />
  })
  return { isInView }
}

describe('createInView — construction', () => {
  it('returns false on mount with no options', () => {
    const { isInView } = renderInView()
    expect(isInView()).toBe(false)
  })

  it('respects `initial: true`', () => {
    // Port of upstream `use-in-view.test.tsx` "Can change initial value".
    const { isInView } = renderInView({ initial: true })
    expect(isInView()).toBe(true)
  })

  it('respects `initial: false` explicitly', () => {
    const { isInView } = renderInView({ initial: false })
    expect(isInView()).toBe(false)
  })

  it('does not throw when constructed without options', () => {
    expect(() => renderInView()).not.toThrow()
  })
})
