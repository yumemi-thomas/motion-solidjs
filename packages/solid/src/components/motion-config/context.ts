import { createContext } from '@/utils'
import type { MotionConfigState } from './types'
import type { Accessor } from 'solid-js'

/**
 * Default motion configuration
 */
export const defaultConfig: MotionConfigState = {
  reducedMotion: 'never',
  transition: undefined,
  nonce: undefined,
}

/**
 * Context for sharing motion configuration with child components
 */
const [injectMotionConfig, , motionConfigInjectionKey] =
  createContext<Accessor<MotionConfigState>>('MotionConfig')

export { motionConfigInjectionKey }

export function createMotionConfig() {
  return injectMotionConfig(() => defaultConfig)
}
