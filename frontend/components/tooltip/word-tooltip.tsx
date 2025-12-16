'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'
import type { Token } from '@/types/token'
import type { DictionaryEntry } from '@/types/dictionary'

import { TooltipContent } from './tooltip-content'
import { useTooltipPosition } from './use-tooltip-position'

export interface WordTooltipProps {
  token: Token | null
  targetRef: React.RefObject<HTMLElement | null>
  entries: DictionaryEntry[]
  isLoading?: boolean
  onClose?: () => void
}

/** Word tooltip that displays dictionary definitions on hover. */
export function WordTooltip({
  token,
  targetRef,
  entries,
  isLoading = false,
  onClose,
}: WordTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const { position, placement } = useTooltipPosition(targetRef, tooltipRef)

  // Close on escape key
  useEffect(() => {
    if (!token) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, token])

  // Don't render if no token
  if (!token) {
    return null
  }

  // Client-side portal - only renders on client
  if (typeof window === 'undefined') {
    return null
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-50 min-w-[280px] max-w-[400px]',
        'bg-popover text-popover-foreground',
        'border rounded-lg shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      data-placement={placement}
    >
      <TooltipContent
        token={token}
        entries={entries}
        isLoading={isLoading}
      />
    </div>
  )

  return createPortal(tooltipContent, document.body)
}
