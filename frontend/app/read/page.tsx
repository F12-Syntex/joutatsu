'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReadingCanvas } from '@/components/canvas/reading-canvas'
import { WordTooltip } from '@/components/tooltip/word-tooltip'
import { useTokenize } from '@/hooks/use-tokenize'
import { useDictionaryLookup } from '@/hooks/use-dictionary-lookup'
import { getContent } from '@/services/content'
import type { Token } from '@/types/token'

function ReadPageContent() {
  const searchParams = useSearchParams()
  const contentId = searchParams.get('content')

  const [inputText, setInputText] = useState('')
  const [contentTitle, setContentTitle] = useState<string | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
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

  // Load content by ID if provided in URL
  useEffect(() => {
    if (!contentId) return

    const loadContent = async () => {
      setIsLoadingContent(true)
      setContentError(null)
      try {
        const data = await getContent(parseInt(contentId, 10))
        setContentTitle(data.content.title)

        // Combine all chunks' raw text
        const fullText = data.chunks
          .sort((a, b) => a.chunk_index - b.chunk_index)
          .map((c) => c.raw_text)
          .join('\n\n')

        setInputText(fullText)

        // Auto-tokenize if we have text
        if (fullText.trim()) {
          await tokenize(fullText)
        }
      } catch (err) {
        setContentError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setIsLoadingContent(false)
      }
    }

    loadContent()
  }, [contentId, tokenize])

  if (isLoadingContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (contentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{contentError}</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{contentTitle || 'Japanese Reading Practice'}</CardTitle>
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

export default function ReadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ReadPageContent />
    </Suspense>
  )
}
