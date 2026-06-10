import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPageInView } from '@/primitives/create-page-in-view'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function setDocumentHidden(hidden: boolean) {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(hidden)
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('createPageInView', () => {
  it('reads true while the page is visible', () => {
    let inView: ReturnType<typeof createPageInView> | undefined

    render(() => {
      inView = createPageInView()
      return null
    })

    expect(inView!()).toBe(true)
  })

  it('tracks visibilitychange events reactively', () => {
    let inView: ReturnType<typeof createPageInView> | undefined

    render(() => {
      inView = createPageInView()
      return null
    })

    setDocumentHidden(true)
    expect(inView!()).toBe(false)

    setDocumentHidden(false)
    expect(inView!()).toBe(true)
  })

  it('removes the listener on cleanup', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = render(() => {
      createPageInView()
      return null
    })
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
