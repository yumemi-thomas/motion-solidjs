export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function getEl(selector: string): HTMLElement {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`element not found: ${selector}`)
  return el as HTMLElement
}

export function getAll(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(selector)) as HTMLElement[]
}

export function transformOf(el: HTMLElement): string {
  return el.style.transform || ''
}
