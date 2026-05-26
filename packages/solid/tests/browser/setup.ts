import { afterEach } from 'vitest'
import { rootProjectionNode } from 'motion-dom'

// Vitest browser injects `body { min-height: 100vh }` (see
// `@vitest/browser/dist/index.js`) which prevents the document from
// shrinking below viewport height. Tests like layout-viewport-jump rely
// on natural document collapse (and the browser's resulting scroll auto-
// cap) when fixtures change height — without this override the body
// stays viewport-tall and scroll stays at its pre-collapse value.
const style = document.createElement('style')
style.textContent = `body { min-height: 0 !important; }`
document.head.appendChild(style)

// Reset motion-dom's projection singleton between tests so leaked stack
// members from one test's mid-flight layoutId animation don't seed the
// next test's `stack.promote(newLead)` with stale `snapshot.latestValues`
// (the bug surfaced as the second test's `snapshot.latestValues.opacity`
// being undefined → `mixValues` mid-animation falling back to the lead's
// final value → `getComputedStyle(box).opacity === '1'` instead of the
// expected `'0.7'` midpoint). motion-react avoids this because cypress
// reloads the page per test; vitest browser-mode reuses the document.
afterEach(() => {
  rootProjectionNode.current?.sharedNodes?.clear()
})
