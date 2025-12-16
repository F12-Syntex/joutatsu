'use client'

import { useRef, useCallback } from 'react'

import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvas-store'
import type { Token } from '@/types/token'

import { TokenDisplay } from './token-display'

interface ReadingCanvasProps {
  className?: string
  onTokenHover?: (token: Token | null) => void
  onTokenClick?: (token: Token) => void
}

/** Main reading canvas for displaying tokenized Japanese text. */
export function ReadingCanvas({
  className,
  onTokenHover,
  onTokenClick,
}: ReadingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tokens = useCanvasStore((s) => s.tokens)
  const settings = useCanvasStore((s) => s.settings)
  const hoveredToken = useCanvasStore((s) => s.hoveredToken)
  const setHoveredToken = useCanvasStore((s) => s.setHoveredToken)
  const isLoading = useCanvasStore((s) => s.isLoading)

  const handleTokenMouseEnter = useCallback(
    (token: Token) => {
      setHoveredToken(token)
      onTokenHover?.(token)
    },
    [setHoveredToken, onTokenHover]
  )

  const handleTokenMouseLeave = useCallback(() => {
    setHoveredToken(null)
    onTokenHover?.(null)
  }, [setHoveredToken, onTokenHover])

  const handleTokenClick = useCallback(
    (token: Token) => {
      onTokenClick?.(token)
    },
    [onTokenClick]
  )

  const canvasStyle = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: settings.fontFamily,
    lineHeight: settings.lineHeight,
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-muted-foreground">
          Enter text to begin reading
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'p-6 overflow-y-auto',
        'selection:bg-primary/20',
        className
      )}
      style={canvasStyle}
    >
      <div className="flex flex-wrap">
        {tokens.map((token, index) => (
          <TokenDisplay
            key={`${token.start}-${token.end}-${index}`}
            token={token}
            isHovered={hoveredToken === token}
            showFurigana={settings.showFurigana}
            highlightUnknown={settings.highlightUnknown}
            onMouseEnter={() => handleTokenMouseEnter(token)}
            onMouseLeave={handleTokenMouseLeave}
            onClick={() => handleTokenClick(token)}
          />
        ))}
      </div>
    </div>
  )
}
