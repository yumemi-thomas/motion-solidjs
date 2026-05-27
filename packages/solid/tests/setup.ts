// jsdom doesn't implement IntersectionObserver, ResizeObserver, matchMedia,
// scrollTo, or a PointerEvent that carries pointer-specific props (happy-dom
// did). Provide inert defaults so tests that don't specifically exercise them
// don't crash; tests that need real behavior override per-test.

// Mirror framer-motion's jest.setup: jsdom's native PointerEvent doesn't
// preserve isPrimary/pointerType/button (so motion-dom's isPrimaryPointer
// rejects the event and gestures never activate). Replace the class so every
// `new PointerEvent(...)` — in tests and inside motion-dom — carries them.
const pointerEventProps = ['isPrimary', 'pointerType', 'button'] as const
class PointerEventFake extends Event {
  constructor(type: string, props?: Record<string, unknown>) {
    super(type, props as EventInit)
    if (!props) return
    for (const prop of pointerEventProps) {
      if (props[prop] != null) (this as Record<string, unknown>)[prop] = props[prop]
    }
  }
}
;(globalThis as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
  PointerEventFake as unknown as typeof PointerEvent

if (!('scrollTo' in globalThis)) {
  ;(globalThis as unknown as { scrollTo: () => void }).scrollTo = () => {}
}

// jsdom's requestAnimationFrame runs on a ~16ms timer, slower than happy-dom's
// near-immediate rAF that these tests were tuned for — so motion-dom's
// frame-scheduled value writes don't land within the tests' short `delay(...)`
// waits. Drive rAF on the macrotask queue so frames fire promptly (still async,
// one callback per tick — no sync-recursion hazard) to match happy-dom timing.
{
  let nextId = 1
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  ;(
    globalThis as unknown as { requestAnimationFrame: typeof requestAnimationFrame }
  ).requestAnimationFrame = ((cb: FrameRequestCallback) => {
    const id = nextId++
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id)
        cb(performance.now())
      }, 0),
    )
    return id
  }) as typeof requestAnimationFrame
  ;(
    globalThis as unknown as { cancelAnimationFrame: typeof cancelAnimationFrame }
  ).cancelAnimationFrame = ((id: number) => {
    const t = timers.get(id)
    if (t) {
      clearTimeout(t)
      timers.delete(id)
    }
  }) as typeof cancelAnimationFrame
}

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
  root = null
  rootMargin = ''
  thresholds = []
}
;(
  globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
).IntersectionObserver ??= MockIntersectionObserver as unknown as typeof IntersectionObserver

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver ??=
  MockResizeObserver as unknown as typeof ResizeObserver

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
