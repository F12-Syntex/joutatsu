'use client'

import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'
import { tokenize as tokenizeApi } from '@/services/api'
import { dictionaryLookup as lookupApi } from '@/services/api'
import type { Token } from '@/types/token'
import type { DictionaryEntry } from '@/types/dictionary'
import { TooltipContent } from '@/components/tooltip/tooltip-content'
import { type PosColors, getPosColorKey } from '@/stores/reader-store'

export interface JapaneseTextProps {
  /** The Japanese text to display */
  text: string
  /** Font size in pixels */
  fontSize?: number
  /** Line height multiplier */
  lineHeight?: number
  /** Font family */
  fontFamily?: string
  /** Whether to show furigana above kanji */
  showFurigana?: boolean
  /** Whether to color by part of speech */
  colorByPos?: boolean
  /** Colors for each part of speech */
  posColors?: PosColors
  /** Custom class name */
  className?: string
  /** Called when tokenization completes */
  onTokenize?: (tokens: Token[]) => void
}

const defaultPosColors: PosColors = {
  verb: '#3b82f6',
  noun: '#f59e0b',
  adjective: '#10b981',
  adverb: '#8b5cf6',
  particle: '#71717a',
  default: 'inherit',
}

/** Self-contained Japanese text component with automatic tokenization and tooltips. */
export function JapaneseText({
  text,
  fontSize = 20,
  lineHeight = 2,
  fontFamily,
  showFurigana = true,
  colorByPos = false,
  posColors = defaultPosColors,
  className,
  onTokenize,
}: JapaneseTextProps) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null)
  const [entries, setEntries] = useState<DictionaryEntry[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const targetRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Tokenize text when it changes
  useEffect(() => {
    if (!text.trim()) {
      setTokens([])
      return
    }

    let cancelled = false
    setIsLoading(true)

    tokenizeApi(text, 'C')
      .then((response) => {
        if (cancelled) return
        const mappedTokens: Token[] = response.tokens.map((t) => ({
          surface: t.surface,
          dictionary_form: t.dictionary_form,
          reading: t.reading,
          pos: t.pos,
          pos_short: t.pos_short,
          start: t.start,
          end: t.end,
          is_known: t.is_known,
        }))
        setTokens(mappedTokens)
        onTokenize?.(mappedTokens)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [text, onTokenize])

  // Dictionary lookup when hovering
  const handleTokenHover = useCallback(
    (token: Token | null, element: HTMLSpanElement | null) => {
      setHoveredToken(token)
      targetRef.current = element

      if (token && element) {
        setIsLookingUp(true)
        lookupApi(token.dictionary_form, 5)
          .then((response) => {
            const mapped: DictionaryEntry[] = response.entries.map((e) => ({
              id: e.id,
              kanji: e.kanji,
              readings: e.readings,
              senses: e.senses.map((s) => ({
                glosses: s.glosses,
                pos: s.pos,
                misc: s.misc || [],
              })),
              pitch_accent: e.pitch_accent.map((p) => ({
                kanji: p.kanji,
                pattern: p.pattern,
              })),
            }))
            setEntries(mapped)
          })
          .catch(() => setEntries([]))
          .finally(() => setIsLookingUp(false))

        // Calculate tooltip position
        const rect = element.getBoundingClientRect()
        const tooltipWidth = 320
        const tooltipHeight = 200

        let x = rect.left + rect.width / 2 - tooltipWidth / 2
        let y = rect.bottom + 8

        // Keep within viewport
        x = Math.max(8, Math.min(x, window.innerWidth - tooltipWidth - 8))
        if (y + tooltipHeight > window.innerHeight - 8) {
          y = rect.top - tooltipHeight - 8
        }

        setTooltipPosition({ x, y })
      } else {
        setEntries([])
      }
    },
    []
  )

  if (isLoading) {
    return (
      <div
        className={cn('animate-pulse text-muted-foreground', className)}
        style={{ fontSize, lineHeight, fontFamily }}
      >
        Loading...
      </div>
    )
  }

  if (tokens.length === 0 && text.trim()) {
    return (
      <div className={className} style={{ fontSize, lineHeight, fontFamily }}>
        {text}
      </div>
    )
  }

  return (
    <>
      <div
        className={cn('flex flex-wrap', className)}
        style={{ fontSize, lineHeight, fontFamily }}
      >
        {tokens.map((token, index) => (
          <TokenSpan
            key={`${token.start}-${token.end}-${index}`}
            token={token}
            isHovered={hoveredToken === token}
            showFurigana={showFurigana}
            colorByPos={colorByPos}
            posColors={posColors}
            onHover={handleTokenHover}
          />
        ))}
      </div>

      {/* Tooltip Portal */}
      {mounted && hoveredToken && (
        createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              'fixed z-[100] min-w-[280px] max-w-[360px]',
              'bg-popover text-popover-foreground',
              'border rounded-lg shadow-xl',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            <TooltipContent
              token={hoveredToken}
              entries={entries}
              isLoading={isLookingUp}
            />
          </div>,
          document.body
        )
      )}
    </>
  )
}

interface TokenSpanProps {
  token: Token
  isHovered: boolean
  showFurigana: boolean
  colorByPos: boolean
  posColors: PosColors
  onHover: (token: Token | null, element: HTMLSpanElement | null) => void
}

const TokenSpan = memo(function TokenSpan({
  token,
  isHovered,
  showFurigana,
  colorByPos,
  posColors,
  onHover,
}: TokenSpanProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isPunctuation = token.pos_short === '補助記号'
  const needsFurigana = showFurigana && hasKanji(token.surface) && !isPunctuation
  const isInteractive = !isPunctuation

  const handleMouseEnter = useCallback(() => {
    if (isInteractive) {
      onHover(token, ref.current)
    }
  }, [isInteractive, onHover, token])

  const handleMouseLeave = useCallback(() => {
    if (isInteractive) {
      onHover(null, null)
    }
  }, [isInteractive, onHover])

  // Get color based on POS
  const posColorKey = getPosColorKey(token.pos_short)
  const textColor = colorByPos ? posColors[posColorKey] : undefined

  return (
    <span
      ref={ref}
      className={cn(
        'transition-colors duration-100',
        isInteractive && 'cursor-pointer',
        isInteractive && isHovered && 'bg-primary/20 rounded px-0.5 -mx-0.5',
        !isInteractive && 'cursor-default'
      )}
      style={{ color: textColor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {needsFurigana ? (
        <ruby>
          {token.surface}
          <rp>(</rp>
          <rt className="text-[0.5em] opacity-60 font-normal">
            {katakanaToHiragana(token.reading)}
          </rt>
          <rp>)</rp>
        </ruby>
      ) : (
        token.surface
      )}
    </span>
  )
})

/** Check if text contains kanji characters. */
function hasKanji(text: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text)
}

/** Convert katakana to hiragana for furigana display. */
function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  )
}
