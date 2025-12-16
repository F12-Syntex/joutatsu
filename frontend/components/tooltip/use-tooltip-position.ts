import { useState, useEffect, type RefObject } from 'react'

export interface Position {
  x: number
  y: number
}

export type Placement = 'top' | 'bottom' | 'left' | 'right'

const PADDING = 8 // Padding from viewport edges
const GAP = 4 // Gap between target and tooltip

interface UseTooltipPositionResult {
  position: Position
  placement: Placement
}

/** Calculate optimal tooltip position avoiding viewport edges. */
export function useTooltipPosition(
  targetRef: RefObject<HTMLElement | null>,
  tooltipRef: RefObject<HTMLElement | null>
): UseTooltipPositionResult {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [placement, setPlacement] = useState<Placement>('bottom')

  useEffect(() => {
    const target = targetRef.current
    const tooltip = tooltipRef.current

    if (!target) {
      return
    }

    const updatePosition = () => {
      const targetRect = target.getBoundingClientRect()
      const tooltipRect = tooltip?.getBoundingClientRect()
      const tooltipWidth = tooltipRect?.width ?? 280
      const tooltipHeight = tooltipRect?.height ?? 200

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Calculate available space in each direction
      const spaceAbove = targetRect.top - PADDING
      const spaceBelow = viewportHeight - targetRect.bottom - PADDING
      const spaceLeft = targetRect.left - PADDING
      const spaceRight = viewportWidth - targetRect.right - PADDING

      // Determine best placement
      let bestPlacement: Placement = 'bottom'
      let x = 0
      let y = 0

      // Prefer bottom, then top, then sides
      if (spaceBelow >= tooltipHeight) {
        bestPlacement = 'bottom'
        y = targetRect.bottom + GAP
      } else if (spaceAbove >= tooltipHeight) {
        bestPlacement = 'top'
        y = targetRect.top - tooltipHeight - GAP
      } else if (spaceRight >= tooltipWidth) {
        bestPlacement = 'right'
        y = targetRect.top + (targetRect.height - tooltipHeight) / 2
      } else if (spaceLeft >= tooltipWidth) {
        bestPlacement = 'left'
        y = targetRect.top + (targetRect.height - tooltipHeight) / 2
      } else {
        // Default to bottom with scroll
        bestPlacement = 'bottom'
        y = targetRect.bottom + GAP
      }

      // Calculate horizontal position for top/bottom placement
      if (bestPlacement === 'top' || bestPlacement === 'bottom') {
        // Center horizontally on target
        x = targetRect.left + (targetRect.width - tooltipWidth) / 2

        // Clamp to viewport
        x = Math.max(PADDING, Math.min(x, viewportWidth - tooltipWidth - PADDING))
      }

      // Calculate vertical position for left/right placement
      if (bestPlacement === 'left') {
        x = targetRect.left - tooltipWidth - GAP
      } else if (bestPlacement === 'right') {
        x = targetRect.right + GAP
      }

      // Clamp vertical position to viewport
      y = Math.max(PADDING, Math.min(y, viewportHeight - tooltipHeight - PADDING))

      setPosition({ x, y })
      setPlacement(bestPlacement)
    }

    updatePosition()

    // Update on scroll or resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [targetRef, tooltipRef])

  return { position, placement }
}
