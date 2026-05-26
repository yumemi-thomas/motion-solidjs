import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RowValue from '@/components/row-value'

afterEach(() => {
  cleanup()
})

describe('row-value', () => {
  it('should render initial value', () => {
    const value = motionValue(10)
    const { container } = render(() => <RowValue value={value} />)

    expect(container.textContent).toBe('10')
  })

  it('should update when value changes', async () => {
    const value = motionValue('initial')
    const { container } = render(() => <RowValue value={value} />)

    expect(container.textContent).toBe('initial')

    value.set('updated')
    await Promise.resolve()

    expect(container.textContent).toBe('updated')
  })

  it('should cleanup subscription on unmount', () => {
    const value = motionValue('test')
    const unsubscribe = vi.fn()
    vi.spyOn(value, 'on').mockImplementation(() => unsubscribe)

    const { unmount } = render(() => <RowValue value={value} />)

    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('should handle different value types', () => {
    const numberValue = motionValue(42)
    const numberWrapper = render(() => <RowValue value={numberValue} />)
    expect(numberWrapper.container.textContent).toBe('42')

    const stringValue = motionValue('hello')
    const stringWrapper = render(() => <RowValue value={stringValue} />)
    expect(stringWrapper.container.textContent).toBe('hello')

    const boolValue = motionValue(true)
    const boolWrapper = render(() => <RowValue value={boolValue} />)
    expect(boolWrapper.container.textContent).toBe('true')
  })

  it('should update DOM element directly when value changes', async () => {
    const value = motionValue('initial')
    const { container } = render(() => <RowValue value={value} />)

    value.set('updated via DOM')
    await Promise.resolve()

    expect(container.textContent).toBe('updated via DOM')
  })
})
