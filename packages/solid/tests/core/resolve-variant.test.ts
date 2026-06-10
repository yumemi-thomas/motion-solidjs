import { describe, expect, it } from 'vitest'
import { resolveDefinitionTarget, targetDefinesKey } from '@/core/resolve-variant'

// Pins the definition-ownership semantics shared by the initial-paint path
// (resolveInitialValues) and the style-ownership filter
// (cleanStylePropForMotionDom via targetDefinesKey).

describe('resolveDefinitionTarget', () => {
  it('merges transitionEnd keys over the target and strips the config props', () => {
    expect(
      resolveDefinitionTarget({ x: 1, transition: { duration: 1 }, transitionEnd: { y: 2 } }, {}),
    ).toEqual({ x: 1, y: 2 })
  })

  it('resolves variant labels', () => {
    expect(resolveDefinitionTarget('active', { active: { opacity: 1 } })).toEqual({ opacity: 1 })
  })

  it('resolves function variants with custom', () => {
    const variants = { active: (custom: number) => ({ x: custom * 2 }) }
    expect(resolveDefinitionTarget('active', variants, 21)).toEqual({ x: 42 })
  })
})

describe('targetDefinesKey', () => {
  it('does not treat the transition config prop as an owned style key', () => {
    // style={{ transition: 'opacity 0.2s' }} must survive the ownership
    // filter even when animate carries a transition config.
    expect(
      targetDefinesKey({ x: 1, transition: { duration: 1 } }, 'transition', {}, undefined),
    ).toBe(false)
  })

  it('treats transitionEnd contents as owned', () => {
    expect(
      targetDefinesKey({ x: 1, transitionEnd: { display: 'block' } }, 'display', {}, undefined),
    ).toBe(true)
  })

  it('recognises ownership through variant labels', () => {
    const variants = { shown: { opacity: 1 } }
    expect(targetDefinesKey('shown', 'opacity', variants, undefined)).toBe(true)
    expect(targetDefinesKey('shown', 'x', variants, undefined)).toBe(false)
  })

  it('resolves function variants with the provided custom', () => {
    const variants = { pos: (custom: { key: string }) => ({ [custom.key]: 1 }) }
    expect(targetDefinesKey('pos', 'y', variants, { key: 'y' })).toBe(true)
    expect(targetDefinesKey('pos', 'y', variants, { key: 'x' })).toBe(false)
  })

  it('rejects booleans and undefined', () => {
    expect(targetDefinesKey(false, 'x', {}, undefined)).toBe(false)
    expect(targetDefinesKey(undefined, 'x', {}, undefined)).toBe(false)
  })
})
