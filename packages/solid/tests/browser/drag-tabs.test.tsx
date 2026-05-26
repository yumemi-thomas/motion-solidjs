import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal, For, on } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, LayoutGroup, motion, MotionConfig, Reorder } from '@/index'
import { cyDrag, nextFrame } from '../features/gestures/drag-test-utils'
import { wait } from './helpers'

afterEach(() => {
  window.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// drag-tabs.ts — LayoutGroup + Reorder + AnimatePresence: layout
// animations should not distort opacity or starting position.
//
// IMPL GAP: every assertion in the cypress test queries pixel-exact
// bounding-box positions and computed-style opacity after reorder /
// add / remove. Reorder + LayoutGroup + AnimatePresence depend on
// layout projection (Reorder.Item uses `layout`, motion.span uses
// `layout="position"`, motion.div with `layout` controls the close
// button slot). Layout projection is not yet wired in the Solid port
// (see _layout-projection.test.ts).

interface Ingredient {
  icon: string
  label: string
}
const allIngredients: Ingredient[] = [
  { icon: '🍅', label: 'Tomato' },
  { icon: '🥬', label: 'Lettuce' },
  { icon: '🧀', label: 'Cheese' },
  { icon: '🥕', label: 'Carrot' },
  { icon: '🍌', label: 'Banana' },
  { icon: '🫐', label: 'Blueberries' },
  { icon: '🥂', label: 'Champers?' },
]
const [tomato, lettuce, cheese] = allIngredients
const initialTabs: Ingredient[] = [tomato!, lettuce!, cheese!]

function removeItem<T>([...arr]: T[], item: T) {
  const i = arr.indexOf(item)
  if (i > -1) arr.splice(i, 1)
  return arr
}
function closestItem<T>(arr: T[], item: T) {
  const i = arr.indexOf(item)
  if (i === -1) return arr[0]!
  if (i === arr.length - 1) return arr[arr.length - 2]!
  return arr[i + 1]!
}
function getNextIngredient(ingredients: Ingredient[]): Ingredient | undefined {
  const existing = new Set(ingredients)
  return allIngredients.find((i) => !existing.has(i))
}

function mount() {
  const [tabs, setTabs] = createSignal<Ingredient[]>(initialTabs)
  const [selectedTab, setSelectedTab] = createSignal<Ingredient | null>(initialTabs[0]!)

  const remove = (item: Ingredient) => {
    if (item === selectedTab()) setSelectedTab(closestItem(tabs(), item))
    setTabs(removeItem(tabs(), item))
  }
  const add = () => {
    const next = getNextIngredient(tabs())
    if (next) {
      setTabs([...tabs(), next])
      setSelectedTab(next)
    }
  }

  return render(() => {
    // The auto-refill effect needs an owner; lives inside render() so the
    // render's createRoot owns it.
    createEffect(
      on(
        () => tabs().length,
        (length) => {
          if (length === 0) {
            const t = setTimeout(() => {
              setTabs(initialTabs)
              setSelectedTab(initialTabs[0]!)
            }, 2000)
            return () => clearTimeout(t)
          }
        },
      ),
    )
    return (
      <MotionConfig transition={{ duration: 0.1 }}>
        <div class="window">
          <nav>
            <LayoutGroup>
              <Reorder.Group as="ul" axis="x" class="tabs" onReorder={setTabs} values={tabs()}>
                <AnimatePresence initial={false}>
                  <For each={tabs()}>
                    {(item) => (
                      <Reorder.Item
                        value={item}
                        id={`${item.label}-tab`}
                        initial={{ opacity: 0, y: 30, transition: { duration: 0.15 } }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.15 },
                        }}
                        exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
                        class={'tab' + (selectedTab() === item ? ' selected' : '')}
                        onPointerDown={() => setSelectedTab(item)}
                        dragTransition={{ bounceStiffness: 10000, bounceDamping: 10000 }}
                      >
                        <motion.span layout="position" id={`${item.label}-label`}>
                          {item.icon} {item.label}
                        </motion.span>
                        <motion.div layout class="close">
                          <button
                            id={`${item.label}-remove`}
                            onPointerDown={(e) => {
                              e.stopPropagation()
                              remove(item)
                            }}
                          >
                            x
                          </button>
                        </motion.div>
                      </Reorder.Item>
                    )}
                  </For>
                </AnimatePresence>
              </Reorder.Group>
              <motion.button
                class="add-item"
                onClick={add}
                disabled={tabs().length === allIngredients.length}
                whileTap={{ scale: 0.9 }}
              >
                +
              </motion.button>
            </LayoutGroup>
          </nav>
          <main>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                id={`${selectedTab() ? selectedTab()!.label : 'empty'}-content`}
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15 }}
              >
                {selectedTab() ? selectedTab()!.icon : '?'}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <style>{styles}</style>
      </MotionConfig>
    )
  })
}

const styles = `
body {
  width: 100vw;
  height: 100vh;
  background: #ff0055;
  overflow: hidden;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.window {
  width: 480px;
  height: 360px;
  border-radius: 10px;
  background: white;
  overflow: hidden;
  box-shadow: 0 1px 1px hsl(0deg 0% 0% / 0.075),
    0 2px 2px hsl(0deg 0% 0% / 0.075), 0 4px 4px hsl(0deg 0% 0% / 0.075),
    0 8px 8px hsl(0deg 0% 0% / 0.075), 0 16px 16px hsl(0deg 0% 0% / 0.075);
  display: flex;
  flex-direction: column;
}

nav {
  background: #fdfdfd;
  padding: 5px 5px 0;
  border-radius: 10px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 1px solid #eeeeee;
  height: 44px;
  display: grid;
  grid-template-columns: 1fr 35px;
  max-width: 480px;
  overflow: hidden;
}

.tabs {
  flex-grow: 1;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  flex-wrap: nowrap;
  width: 420px;
  padding-right: 10px;
}

main {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 128px;
  flex-grow: 1;
  user-select: none;
}

ul,
li {
  list-style: none;
  padding: 0;
  margin: 0;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
  font-size: 14px;
}

li {
  border-radius: 5px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  width: 100%;
  padding: 10px 15px;
  background: white;
  cursor: pointer;
  height: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  position: relative;
  user-select: none;
}

li span {
  color: black;
  flex-shrink: 1;
  flex-grow: 1;
  white-space: nowrap;
  display: block;
  min-width: 0;
  padding-right: 30px;
  mask-image: linear-gradient(to left, transparent 10px, #fff 30px);
  -webkit-mask-image: linear-gradient(to left, transparent 10px, #fff 30px);
}

li .close {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

li button {
  width: 20px;
  height: 20px;
  border: 0;
  background: #fff;
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  stroke: #000;
  margin-left: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.add-item {
  width: 30px;
  height: 30px;
  background: #eee;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  align-self: center;
}

.add-item:disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}
`

describe('Tabs demo', () => {
  // BLOCKED: requires layout projection (Reorder.Item layout,
  // motion.span layout="position", motion.div layout, LayoutGroup).
  it("Layout animations don't interfere with opacity", async () => {
    const wrapper = mount()
    const btn = wrapper.container.querySelector('button.add-item') as HTMLButtonElement
    await wait(50)
    btn.click()
    const tab = wrapper.container.querySelector('#Carrot-tab') as HTMLElement
    for (let i = 0; i < 10 && getComputedStyle(tab).opacity !== '1'; i++) {
      await wait(50)
    }
    expect(getComputedStyle(tab).opacity).toBe('1')
    await nextFrame()
  })

  it("First tab doesn't distort when multiple layout animations started", async () => {
    const wrapper = mount()
    await wait(50)
    const label1 = wrapper.container.querySelector('#Tomato-label') as HTMLElement
    {
      const r = label1.getBoundingClientRect()
      expect(r.left).toBe(280)
      expect(r.right).toBe(390)
    }
    const btn = wrapper.container.querySelector('button.add-item') as HTMLButtonElement
    btn.click()
    await wait(20)
    btn.click()
    await wait(100)
    {
      const r = (
        wrapper.container.querySelector('#Tomato-label') as HTMLElement
      ).getBoundingClientRect()
      expect(r.left).toBe(280)
      expect(r.right).toBe(334)
    }
  })
})
