'use client'

import { memo, forwardRef } from 'react'

import { cn } from '@/lib/utils'
import type { Token } from '@/types/token'

export interface TokenDisplayProps {
  token: Token
  isHovered?: boolean
  isSelected?: boolean
  showFurigana?: boolean
  highlightUnknown?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
}

/** Individual token display with hover state and furigana. */
export const TokenDisplay = memo(
  forwardRef<HTMLSpanElement, TokenDisplayProps>(function TokenDisplay(
    {
      token,
      isHovered = false,
      isSelected = false,
      showFurigana = true,
      highlightUnknown = true,
      onMouseEnter,
      onMouseLeave,
      onClick,
    },
    ref
  ) {
    const isPunctuation = isPunctuationToken(token)
    const needsFurigana = showFurigana && hasKanji(token.surface) && !isPunctuation
    const isInteractive = !isPunctuation

    return (
      <span
        ref={ref}
        className={cn(
          'transition-colors duration-100',
          isInteractive && 'cursor-pointer',
          isInteractive && isHovered && 'bg-primary/20 rounded',
          isInteractive && isSelected && 'bg-primary/30 rounded',
          isInteractive && highlightUnknown && !token.is_known && 'text-primary',
          !isInteractive && 'cursor-default'
        )}
        onMouseEnter={isInteractive ? onMouseEnter : undefined}
        onMouseLeave={isInteractive ? onMouseLeave : undefined}
        onClick={isInteractive ? onClick : undefined}
        data-token-start={token.start}
        data-token-end={token.end}
        data-is-known={token.is_known}
      >
        {needsFurigana ? (
          <ruby>
            {token.surface}
            <rp>(</rp>
            <rt className="text-xs opacity-60">
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
)

/** Check if token is punctuation. */
export function isPunctuationToken(token: Token): boolean {
  return token.pos_short === '補助記号'
}

/** Check if token is a content word (noun, verb, adjective, adverb). */
export function isContentWord(token: Token): boolean {
  const contentPos = new Set(['名詞', '動詞', '形容詞', '副詞'])
  return contentPos.has(token.pos_short)
}

/** Check if text contains kanji characters. */
export function hasKanji(text: string): boolean {
  // CJK Unified Ideographs + CJK Extension A
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text)
}

/** Convert katakana to hiragana for furigana display. */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  )
}

/** Convert hiragana to katakana. */
export function hiraganaToKatakana(text: string): string {
  return text.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  )
}
