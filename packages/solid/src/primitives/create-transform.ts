import type { MotionValue, TransformOptions } from 'motion-dom'
import { motionValue, transform } from 'motion-dom'
import { createEffect } from 'solid-js'
import { type MaybeAccessor, isAccessor, resolveAccessor } from '@/types'
import { createCombinedMotionValue } from '@/primitives/create-combined-motion-value'
import { createComputed } from '@/primitives/create-computed'

type InputRange = number[]
type RangeDefinition = MaybeAccessor<InputRange>
type SingleTransformer<I, O> = (input: I) => O
type ValueOfMotionValue<T> = T extends MotionValue<infer V> ? V : never
type MotionValueValues<T extends readonly MotionValue<unknown>[]> = {
  -readonly [K in keyof T]: ValueOfMotionValue<T[K]>
}
type MultiTransformer<T extends readonly MotionValue<unknown>[], O> = (
  input: MotionValueValues<T>,
) => O

type OutputMap = Record<string, readonly unknown[]>
type OutputMapValues<T extends OutputMap> = T[keyof T][number]
type OutputMapMotionValues<T extends OutputMap> = {
  [K in keyof T]: MotionValue<T[K][number]>
}

type ListTransformer<O> = (values: readonly unknown[]) => O

type MotionValueList = readonly MotionValue<string | number>[]
function isMotionValueList(value: unknown): value is MotionValueList {
  return Array.isArray(value)
}

function isRangeMap<T extends OutputMap>(value: unknown): value is T {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every(Array.isArray)
  )
}

function isRangeDefinition(value: unknown): value is RangeDefinition {
  return Array.isArray(value) || typeof value === 'function'
}

function isTransformer<T extends (...args: any[]) => unknown>(
  value: unknown,
  outputRange: unknown,
): value is T {
  return typeof value === 'function' && outputRange === undefined
}

function assertMotionValueValues<T extends readonly MotionValue<unknown>[]>(
  input: T,
  values: readonly unknown[],
): asserts values is MotionValueValues<T> {
  if (values.length !== input.length) {
    throw new Error('createTransform received an unexpected number of MotionValue values')
  }
}

function invariantNumber(value: unknown): number {
  if (typeof value !== 'number') {
    throw new Error('createTransform range transforms require a numeric MotionValue')
  }

  return value
}

/**
 * Derives a new `MotionValue` from one or more inputs. Supports four shapes:
 * range mapping (input → outputRange), single-value transformer, multi-value
 * transformer, and dependency-tracked computed.
 *
 * @example
 * ```tsx
 * // Range mapping
 * const { scrollYProgress } = createScroll()
 * const opacity = createTransform(scrollYProgress, [0, 0.5], [0, 1])
 *
 * // Transformer
 * const x = createMotionValue(0)
 * const doubled = createTransform(x, (v) => v * 2)
 *
 * // Dependency-tracked computed
 * const angle = createTransform(() => x.get() / 10)
 * ```
 */
export function createTransform<O>(
  value: MotionValue<number>,
  inputRange: MaybeAccessor<InputRange>,
  outputRange: O[],
  options?: TransformOptions<O>,
): MotionValue<O>

export function createTransform<O>(transformer: () => O): MotionValue<O>

export function createTransform<I, O>(
  input: MotionValue<I>,
  transformer: SingleTransformer<I, O>,
): MotionValue<O>

export function createTransform<const T extends readonly MotionValue<string | number>[], O>(
  input: T,
  transformer: MultiTransformer<T, O>,
): MotionValue<O>

export function createTransform<T extends OutputMap>(
  value: MotionValue<number>,
  inputRange: MaybeAccessor<InputRange>,
  outputRange: T,
  options?: TransformOptions<OutputMapValues<T>>,
): OutputMapMotionValues<T>

export function createTransform<I, O, T extends OutputMap>(
  input: MotionValue<I> | readonly MotionValue<string | number>[] | (() => O),
  inputRangeOrTransformer?:
    | MaybeAccessor<InputRange>
    | SingleTransformer<I, O>
    | ListTransformer<O>,
  outputRange?: O[] | T,
  options?: TransformOptions<O>,
): MotionValue<O> | OutputMapMotionValues<T> {
  if (typeof input === 'function') {
    return createComputed(input)
  }

  if (isMotionValueList(input)) {
    if (isTransformer<MultiTransformer<typeof input, O>>(inputRangeOrTransformer, outputRange)) {
      return createMultiValueTransform(input, inputRangeOrTransformer)
    }

    throw new Error(
      'createTransform requires a transformer function when input is a MotionValue array',
    )
  }

  if (isRangeMap<T>(outputRange) && isRangeDefinition(inputRangeOrTransformer)) {
    return createTransformMap<T>(input, inputRangeOrTransformer, outputRange, options)
  }

  if (outputRange && typeof outputRange === 'object' && !Array.isArray(outputRange)) {
    throw new Error('createTransform output maps require output range arrays')
  }

  if (isTransformer<SingleTransformer<I, O>>(inputRangeOrTransformer, outputRange)) {
    return createMotionValueTransform(input, inputRangeOrTransformer)
  }

  if (Array.isArray(outputRange) && isRangeDefinition(inputRangeOrTransformer)) {
    const result = createRangeTransform(input, inputRangeOrTransformer, outputRange, options)

    addAcceleratedTransform(result, input, inputRangeOrTransformer, outputRange, options)

    return result
  }

  throw new Error('Invalid createTransform arguments')
}

function createTransformMap<T extends OutputMap>(
  input: MotionValue<unknown>,
  inputRange: RangeDefinition,
  outputRanges: T,
  options?: TransformOptions<OutputMapValues<T>>,
): OutputMapMotionValues<T> {
  const result = {} as OutputMapMotionValues<T>

  for (const key in outputRanges) {
    result[key] = createRangeTransform<T[typeof key][number]>(
      input,
      inputRange,
      outputRanges[key],
      options,
    )
  }

  return result
}

function createMotionValueTransform<I, O>(
  input: MotionValue<I>,
  transformer: SingleTransformer<I, O>,
): MotionValue<O> {
  const { value, subscribe } = createCombinedMotionValue(() => transformer(input.get()))
  subscribe([input])
  return value
}

function createMultiValueTransform<const T extends readonly MotionValue<string | number>[], O>(
  input: T,
  transformer: MultiTransformer<T, O>,
): MotionValue<O> {
  return createListTransform([...input], (values) => {
    assertMotionValueValues(input, values)
    return transformer(values)
  })
}

function createRangeTransform<O>(
  input: MotionValue<unknown>,
  inputRange: RangeDefinition,
  outputRange: readonly O[],
  options: TransformOptions<O> | undefined,
): MotionValue<O> {
  if (isAccessor(inputRange)) {
    const bridge = motionValue(0)

    createEffect(() => {
      inputRange()
      bridge.set(bridge.get() + 1)
    })

    return createListTransform([input, bridge], ([latest]) =>
      transform(inputRange(), [...outputRange], options)(invariantNumber(latest)),
    )
  }

  const transformer = transform(inputRange, [...outputRange], options)

  return createListTransform([input], ([latest]) => transformer(invariantNumber(latest)))
}

function addAcceleratedTransform<O>(
  result: MotionValue<O>,
  input: MotionValue<unknown>,
  inputRange: RangeDefinition,
  outputRange: O[],
  options: TransformOptions<O> | undefined,
) {
  if (options?.clamp === false) {
    return
  }

  const inputAccelerate = input.accelerate

  if (!inputAccelerate || inputAccelerate.isTransformed) {
    return
  }

  result.accelerate = {
    ...inputAccelerate,
    times: resolveAccessor(inputRange),
    keyframes: outputRange,
    isTransformed: true,
    ...(options?.ease ? { ease: options.ease } : {}),
  }
}

function createListTransform<O>(
  values: readonly MotionValue<unknown>[],
  transformer: ListTransformer<O>,
): MotionValue<O> {
  const latest: unknown[] = []

  const combineValues = () => {
    latest.length = 0

    for (let i = 0; i < values.length; i++) {
      latest[i] = values[i].get()
    }

    return transformer(latest)
  }

  const { value, subscribe } = createCombinedMotionValue(combineValues)

  subscribe([...values])

  return value
}
