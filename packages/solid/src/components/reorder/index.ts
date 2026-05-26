import Group from './group'
import Item from './item'

export const ReorderGroup = Group
export const ReorderItem = Item
export const Reorder = {
  Group,
  Item,
}

export { Group, Item }
export type { SolidReorderGroupProps } from './group'
export type { SolidReorderItemProps } from './item'
export type * from './types'
