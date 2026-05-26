import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { injectLayoutGroup } from '@/components/context'
import LayoutGroup from '@/components/layout-group'

afterEach(() => {
  cleanup()
})

function Consumer(props: { id?: string }) {
  const value = injectLayoutGroup({})

  return <div data-testid={props.id ?? '1'}>{value.id}</div>
}

describe('LayoutGroup', () => {
  it('if it is the first LayoutGroup it sets the group id', () => {
    const wrapper = render(() => (
      <LayoutGroup id="a">
        <Consumer />
      </LayoutGroup>
    ))

    expect(wrapper.getByTestId('1').textContent).toBe('a')
  })

  it('if it is a nested LayoutGroup it appends to the group id', () => {
    const wrapper = render(() => (
      <LayoutGroup id="a">
        <LayoutGroup id="b">
          <Consumer />
        </LayoutGroup>
      </LayoutGroup>
    ))

    expect(wrapper.getByTestId('1').textContent).toBe('a-b')
  })

  it('if the value of id is undefined, it does not change the group id', () => {
    const wrapper = render(() => (
      <LayoutGroup id="a">
        <LayoutGroup id={undefined}>
          <Consumer />
        </LayoutGroup>
      </LayoutGroup>
    ))

    expect(wrapper.getByTestId('1').textContent).toBe('a')
  })

  it('if the parent group id is undefined, child LayoutGroups still append the group id', () => {
    const wrapper = render(() => (
      <LayoutGroup id="a">
        <LayoutGroup id={undefined}>
          <LayoutGroup id="b">
            <Consumer />
          </LayoutGroup>
        </LayoutGroup>
      </LayoutGroup>
    ))

    expect(wrapper.getByTestId('1').textContent).toBe('a-b')
  })
})
