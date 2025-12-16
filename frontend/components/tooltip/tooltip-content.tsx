'use client'

import { cn } from '@/lib/utils'
import type { Token } from '@/types/token'
import type { DictionaryEntry } from '@/types/dictionary'

import { PitchDisplay } from './pitch-display'

interface TooltipContentProps {
  token: Token
  entries: DictionaryEntry[]
  isLoading?: boolean
  className?: string
}

/** Content of the word tooltip showing definitions. */
export function TooltipContent({
  token,
  entries,
  isLoading = false,
  className,
}: TooltipContentProps) {
  return (
    <div className={cn('p-3 space-y-3', className)}>
      {/* Header with word and reading */}
      <TooltipHeader token={token} />

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Looking up...
        </div>
      )}

      {/* No results */}
      {!isLoading && entries.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No definitions found
        </div>
      )}

      {/* Dictionary entries */}
      {!isLoading && entries.length > 0 && (
        <div className="space-y-3">
          {entries.slice(0, 3).map((entry, index) => (
            <DefinitionEntry key={entry.id || index} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

interface TooltipHeaderProps {
  token: Token
}

/** Header showing the word and its reading. */
function TooltipHeader({ token }: TooltipHeaderProps) {
  return (
    <div className="border-b pb-2">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-medium">{token.surface}</span>
        {token.dictionary_form !== token.surface && (
          <span className="text-sm text-muted-foreground">
            ({token.dictionary_form})
          </span>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        {katakanaToHiragana(token.reading)} · {token.pos_short}
      </div>
    </div>
  )
}

interface DefinitionEntryProps {
  entry: DictionaryEntry
}

/** Single dictionary entry with definitions. */
function DefinitionEntry({ entry }: DefinitionEntryProps) {
  return (
    <div className="space-y-1">
      {/* Kanji/readings */}
      {entry.kanji.length > 0 && (
        <div className="text-sm font-medium">
          {entry.kanji.join('、')}
          {entry.readings.length > 0 && (
            <span className="text-muted-foreground ml-1">
              【{entry.readings.join('、')}】
            </span>
          )}
        </div>
      )}

      {/* Pitch accent */}
      {entry.pitch_accent.length > 0 && (
        <PitchDisplay
          patterns={entry.pitch_accent}
          reading={entry.readings[0]}
          className="mt-1"
        />
      )}

      {/* Senses/definitions */}
      <ol className="list-decimal list-inside space-y-0.5">
        {entry.senses.slice(0, 3).map((sense, index) => (
          <li key={index} className="text-sm">
            {sense.pos.length > 0 && (
              <span className="text-xs text-muted-foreground mr-1">
                ({sense.pos.slice(0, 2).join(', ')})
              </span>
            )}
            {sense.glosses.slice(0, 3).join('; ')}
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Convert katakana to hiragana. */
function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  )
}
