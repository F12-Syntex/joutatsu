'use client'

import { useState, useRef, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReadingCanvas } from '@/components/canvas/reading-canvas'
import { WordTooltip } from '@/components/tooltip/word-tooltip'
import { useTokenize } from '@/hooks/use-tokenize'
import { useDictionaryLookup } from '@/hooks/use-dictionary-lookup'
import type { Token } from '@/types/token'

export default function ReadPage() {
  const [inputText, setInputText] = useState('')
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  const { tokenize, isLoading: isTokenizing } = useTokenize()
  const {
    lookup,
    isLoading: isLookingUp,
    entries,
  } = useDictionaryLookup()

  const handleTokenize = useCallback(async () => {
    if (!inputText.trim()) return
    await tokenize(inputText)
  }, [inputText, tokenize])

  const handleTokenHover = useCallback(
    (token: Token | null) => {
      setHoveredToken(token)
      if (token) {
        // Look up the dictionary form
        lookup(token.dictionary_form)
        // Find the hovered element by data attribute
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

  const handleTokenClick = useCallback(
    (token: Token) => {
      // Could be used for selection or other actions
      console.log('Token clicked:', token)
    },
    []
  )

  const handleCloseTooltip = useCallback(() => {
    setHoveredToken(null)
    targetRef.current = null
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Japanese Reading Practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter Japanese text to practice reading..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] text-lg"
            />
            <Button
              onClick={handleTokenize}
              disabled={isTokenizing || !inputText.trim()}
            >
              {isTokenizing ? 'Processing...' : 'Tokenize'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <ReadingCanvas
              className="min-h-[300px]"
              onTokenHover={handleTokenHover}
              onTokenClick={handleTokenClick}
            />
          </CardContent>
        </Card>

        <WordTooltip
          token={hoveredToken}
          targetRef={targetRef}
          entries={entries}
          isLoading={isLookingUp}
          onClose={handleCloseTooltip}
        />
      </div>
    </div>
  )
}
