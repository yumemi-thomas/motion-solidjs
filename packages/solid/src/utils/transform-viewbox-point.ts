import type { Point, TransformPoint } from 'motion-utils'
import type { Accessor } from 'solid-js'

/**
 * Creates a `transformPagePoint` function that accounts for SVG viewBox scaling.
 *
 * When dragging SVG elements inside an SVG with a viewBox that differs from
 * the rendered dimensions (e.g., `viewBox="0 0 100 100"` but rendered at 500x500 pixels),
 * pointer coordinates need to be transformed to match the SVG's coordinate system.
 *
 * Solid takes the SVG element via an accessor (`() => ref`) rather than a
 * React-style `RefObject`.
 *
 * @example
 * ```tsx
 * function App() {
 *   let svgRef!: SVGSVGElement
 *
 *   return (
 *     <MotionConfig transformPagePoint={transformViewBoxPoint(() => svgRef)}>
 *       <svg ref={svgRef} viewBox="0 0 100 100" width={500} height={500}>
 *         <motion.rect drag width={10} height={10} />
 *       </svg>
 *     </MotionConfig>
 *   )
 * }
 * ```
 *
 * @param getSvg - Accessor returning the SVG element
 * @returns A transformPagePoint function for use with MotionConfig
 *
 * @public
 */
export function transformViewBoxPoint(
  getSvg: Accessor<SVGSVGElement | null | undefined>,
): TransformPoint {
  return (point: Point): Point => {
    const svg = getSvg()
    if (!svg) {
      return point
    }

    const viewBox = svg.viewBox?.baseVal
    if (!viewBox || (viewBox.width === 0 && viewBox.height === 0)) {
      return point
    }

    const bbox = svg.getBoundingClientRect()
    if (bbox.width === 0 || bbox.height === 0) {
      return point
    }

    const scaleX = viewBox.width / bbox.width
    const scaleY = viewBox.height / bbox.height

    const svgX = bbox.left + window.scrollX
    const svgY = bbox.top + window.scrollY

    // Translate to SVG-local space, scale by viewBox/viewport ratio, then translate back.
    return {
      x: (point.x - svgX) * scaleX + svgX,
      y: (point.y - svgY) * scaleY + svgY,
    }
  }
}
