import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, For } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
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
// drag-snap-layout-id-swap.ts — #3315: drag + dragSnapToOrigin +
// layoutId; same-row swap must not leave a stranded drag transform on
// the remounted tile.
//
// IMPL GAP: requires layout projection (every tile uses `layoutId`),
// and the exact post-swap pixel positions depend on the projection
// engine re-running. Not wired in the Solid port yet.

const TILES_PER_ROW = 3
const TILE_SIZE = 60
const GRID_SIZE = TILE_SIZE * TILES_PER_ROW

interface Tile {
  id: number
}

function mount() {
  const initial: Tile[][] = []
  for (let i = 0; i < TILES_PER_ROW; i++) {
    const r: Tile[] = []
    for (let j = 0; j < TILES_PER_ROW; j++) r.push({ id: i * TILES_PER_ROW + j })
    initial.push(r)
  }
  const [tiles, setTiles] = createSignal<Tile[][]>(initial)
  const tileState = () =>
    tiles()
      .map((row) => row.map((t) => t.id).join(','))
      .join('|')

  const handleDragEnd = (
    draggedPos: { x: number; y: number },
    info: { offset: { x: number; y: number } },
  ) => {
    const dropX = draggedPos.x + Math.round(info.offset.x / TILE_SIZE)
    const dropY = draggedPos.y + Math.round(info.offset.y / TILE_SIZE)
    const cur = tiles()
    if (
      dropX < 0 ||
      dropX >= TILES_PER_ROW ||
      dropY < 0 ||
      dropY >= TILES_PER_ROW ||
      (draggedPos.x === dropX && draggedPos.y === dropY)
    )
      return
    const next = cur.map((row) => [...row])
    next[dropY]![dropX] = cur[draggedPos.y]![draggedPos.x]!
    next[draggedPos.y]![draggedPos.x] = cur[dropY]![dropX]!
    setTiles(next)
  }

  return render(() => (
    <div style={{ padding: '50px' }}>
      <div
        id="grid"
        data-tile-state={tileState()}
        style={{
          border: 'solid 1px black',
          width: `${GRID_SIZE}px`,
          height: `${GRID_SIZE}px`,
          position: 'relative',
        }}
      >
        <For each={tiles()}>
          {(row, y) => (
            <For each={row}>
              {(tile, x) => (
                <motion.div
                  data-testid={`tile-${tile.id}`}
                  style={{
                    position: 'absolute',
                    border: 'solid 1px black',
                    width: `${TILE_SIZE}px`,
                    height: `${TILE_SIZE}px`,
                    top: `${y() * TILE_SIZE}px`,
                    left: `${x() * TILE_SIZE}px`,
                    display: 'flex',
                    'justify-content': 'center',
                    'align-items': 'center',
                    'background-color': '#fff',
                  }}
                  layoutId={String(tile.id)}
                  drag
                  dragSnapToOrigin
                  onDragEnd={(_, info) => handleDragEnd({ x: x(), y: y() }, info)}
                  whileDrag={{ zIndex: 1 }}
                >
                  {tile.id}
                </motion.div>
              )}
            </For>
          )}
        </For>
      </div>
    </div>
  ))
}

describe('drag + dragSnapToOrigin + layoutId horizontal swap', () => {
  // BLOCKED: layoutId-based swap needs layout projection.
  it('does not strand the drag transform after a same-row swap', async () => {
    const wrapper = mount()
    await wait(200)

    const tile0 = wrapper.getByTestId('tile-0')
    const grid = wrapper.container.querySelector('#grid') as HTMLElement
    const gridRect = grid.getBoundingClientRect()
    const gridLeft = gridRect.left + 1
    const gridTop = gridRect.top + 1
    {
      const r = tile0.getBoundingClientRect()
      expect(r.left).toBeCloseTo(gridLeft, 0)
      expect(r.top).toBeCloseTo(gridTop, 0)
    }

    const pointer = cyDrag(tile0, 5, 5)
    await pointer.to(10, 5)
    await wait(50)
    await pointer.to(35, 5)
    await wait(50)
    pointer.end()
    // Layout-id swap animation uses motion's default spring; 800ms is
    // ample full-settle.
    await wait(800)

    expect(grid.getAttribute('data-tile-state')).toMatch(/^1,0,/)

    {
      const r = wrapper.getByTestId('tile-0').getBoundingClientRect()
      expect(r.left).toBeCloseTo(gridLeft + TILE_SIZE, 0)
      expect(r.top).toBeCloseTo(gridTop, 0)
    }
    {
      const r = wrapper.getByTestId('tile-1').getBoundingClientRect()
      expect(r.left).toBeCloseTo(gridLeft, 0)
      expect(r.top).toBeCloseTo(gridTop, 0)
    }

    await nextFrame()
  })
})
