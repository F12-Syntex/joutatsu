'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { RefreshCw, Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReadingCanvas } from '@/components/canvas/reading-canvas'
import { WordTooltip } from '@/components/tooltip/word-tooltip'
import { useTokenize } from '@/hooks/use-tokenize'
import { useDictionaryLookup } from '@/hooks/use-dictionary-lookup'
import {
  getRandomSentence,
  type PracticeSentence,
} from './practice-sentences'
import type { Token } from '@/types/token'

const levelLabels = {
  beginner: 'Beginner (N5)',
  elementary: 'Elementary (N4)',
  intermediate: 'Intermediate (N3)',
  advanced: 'Advanced (N2-N1)',
} as const

type Level = PracticeSentence['level']

// Get initial sentence synchronously for immediate display
const initialSentence = getRandomSentence()

export function QuickReader() {
  const [level, setLevel] = useState<Level | undefined>(undefined)
  const [currentSentence, setCurrentSentence] = useState<PracticeSentence>(initialSentence)
  const [showTranslation, setShowTranslation] = useState(false)
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const initRef = useRef(false)

  const { tokenize, isLoading: isTokenizing } = useTokenize()
  const { lookup, isLoading: isLookingUp, entries } = useDictionaryLookup()

  // Tokenize initial sentence on mount (ref pattern for strict mode)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    tokenize(initialSentence.text)
  }, [tokenize])

  const loadNewSentence = useCallback(async () => {
    const sentence = getRandomSentence(level)
    setCurrentSentence(sentence)
    setShowTranslation(false)
    await tokenize(sentence.text)
  }, [level, tokenize])

  const handleLevelChange = useCallback(
    async (newLevel: Level | undefined) => {
      setLevel(newLevel)
      const sentence = getRandomSentence(newLevel)
      setCurrentSentence(sentence)
      setShowTranslation(false)
      await tokenize(sentence.text)
    },
    [tokenize]
  )

  const handleTokenHover = useCallback(
    (token: Token | null) => {
      setHoveredToken(token)
      if (token) {
        lookup(token.dictionary_form)
        const element = document.querySelector(
          `[data-token-start="${token.start}"][data-token-end="${token.end}"]`
        ) as HTMLElement | null
        targetRef.current = element
      } else {
        targetRef.current = null
      }
    },
    [lookup]
  )

  const handleCloseTooltip = useCallback(() => {
    setHoveredToken(null)
    targetRef.current = null
  }, [])

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Quick Practice</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {level ? levelLabels[level] : 'All Levels'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLevelChange(undefined)}>
                  All Levels
                </DropdownMenuItem>
                {(Object.keys(levelLabels) as Level[]).map((l) => (
                  <DropdownMenuItem key={l} onClick={() => handleLevelChange(l)}>
                    {levelLabels[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              onClick={loadNewSentence}
              disabled={isTokenizing}
            >
              {isTokenizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reading Canvas */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <ReadingCanvas
            className="min-h-[60px] text-xl leading-relaxed"
            onTokenHover={handleTokenHover}
          />
        </div>

        {/* Translation Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-muted-foreground"
          >
            {showTranslation ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Translation
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Translation
              </>
            )}
          </Button>
          {currentSentence && (
            <span className="text-xs text-muted-foreground capitalize">
              {currentSentence.level}
            </span>
          )}
        </div>

        {/* Translation */}
        {showTranslation && currentSentence && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            {currentSentence.translation}
          </div>
        )}

        {/* Tooltip */}
        <WordTooltip
          token={hoveredToken}
          targetRef={targetRef}
          entries={entries}
          isLoading={isLookingUp}
          onClose={handleCloseTooltip}
        />
      </CardContent>
    </Card>
  )
}
