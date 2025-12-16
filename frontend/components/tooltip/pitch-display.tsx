'use client'

import { cn } from '@/lib/utils'
import type { PitchPattern } from '@/types/dictionary'

interface PitchDisplayProps {
  patterns: PitchPattern[]
  reading?: string
  className?: string
}

/** Display pitch accent patterns with visual markers. */
export function PitchDisplay({ patterns, reading, className }: PitchDisplayProps) {
  if (patterns.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {patterns.map((pattern, index) => (
        <PitchPattern
          key={`${pattern.kanji}-${pattern.pattern}-${index}`}
          pattern={pattern}
          reading={reading}
        />
      ))}
    </div>
  )
}

interface PitchPatternProps {
  pattern: PitchPattern
  reading?: string
}

/** Single pitch pattern visualization. */
function PitchPattern({ pattern, reading }: PitchPatternProps) {
  const pitchNumber = parseInt(pattern.pattern, 10)
  const displayText = reading || pattern.kanji

  if (isNaN(pitchNumber) || !displayText) {
    return null
  }

  // Parse pitch pattern:
  // 0 = heiban (flat) - low-high-high...
  // 1 = atamadaka (head-high) - high-low-low...
  // n = nakadaka (middle-high) - low-high...-low at position n
  const morae = splitIntoMorae(displayText)
  const pitchLevels = calculatePitchLevels(morae.length, pitchNumber)

  return (
    <div className="inline-flex items-center gap-1 text-sm">
      <span className="text-muted-foreground text-xs">[{pitchNumber}]</span>
      <div className="inline-flex items-end h-6">
        {morae.map((mora, i) => (
          <span
            key={i}
            className={cn(
              'inline-block px-0.5 border-b-2 transition-all',
              pitchLevels[i] === 'high' ? 'border-primary -mb-2' : 'border-muted mb-0'
            )}
          >
            {mora}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Split Japanese text into morae (syllable units). */
function splitIntoMorae(text: string): string[] {
  const morae: string[] = []
  const smallKana = new Set('ぁぃぅぇぉゃゅょゎァィゥェォャュョヮっッ')

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (next && smallKana.has(next)) {
      // Combine with following small kana
      morae.push(char + next)
      i++
    } else if (smallKana.has(char) && morae.length > 0) {
      // Should have been combined, but wasn't - add to previous
      morae[morae.length - 1] += char
    } else {
      morae.push(char)
    }
  }

  return morae
}

/** Calculate pitch levels for each mora. */
function calculatePitchLevels(length: number, pitch: number): ('high' | 'low')[] {
  const levels: ('high' | 'low')[] = []

  for (let i = 0; i < length; i++) {
    if (pitch === 0) {
      // Heiban: first mora low, rest high
      levels.push(i === 0 ? 'low' : 'high')
    } else if (pitch === 1) {
      // Atamadaka: first mora high, rest low
      levels.push(i === 0 ? 'high' : 'low')
    } else {
      // Nakadaka: low, then high until pitch position, then low
      if (i === 0) {
        levels.push('low')
      } else if (i < pitch) {
        levels.push('high')
      } else {
        levels.push('low')
      }
    }
  }

  return levels
}
