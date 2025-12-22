'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { JapaneseText } from '@/components/japanese-text'
import { Button } from '@/components/ui/button'
import { ReaderSettings, DifficultyRating } from '@/components/reader'
import { useReaderStore } from '@/stores/reader-store'
import { useProficiency } from '@/hooks/use-proficiency'
import { getReadingPractice } from '@/services/content'
import type { Token } from '@/types/token'
import type { ReadingPractice } from '@/types/content'

type ReaderState = 'reading' | 'rating' | 'empty'

// Fallback sample texts if no content in database
const sampleTexts = [
  '日本語を勉強しています。毎日少しずつ上達しています。',
  '桜の季節になると、多くの人々が公園に集まります。',
  '日本の伝統的な食文化は、世界中で高く評価されています。',
  '富士山は日本で最も高い山で、その美しさは古くから多くの芸術家に影響を与えてきました。',
]

function getRandomFallbackText(excludeText?: string): string {
  const available = excludeText
    ? sampleTexts.filter((t) => t !== excludeText)
    : sampleTexts
  return available[Math.floor(Math.random() * available.length)]
}

export default function ReaderPage() {
  const [state, setState] = useState<ReaderState>('reading')
  const [currentText, setCurrentText] = useState('')
  const [currentPractice, setCurrentPractice] = useState<ReadingPractice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [tokenCount, setTokenCount] = useState(0)
  const [textIndex, setTextIndex] = useState(0)
  const { settings, installedFonts } = useReaderStore()
  const { recordDifficulty } = useProficiency()

  // Fetch content from database on mount
  const fetchPractice = useCallback(async (excludeContentId?: number) => {
    setIsLoading(true)
    try {
      const practice = await getReadingPractice(excludeContentId)
      setCurrentPractice(practice)
      setCurrentText(practice.text)
      setUsingFallback(false)
    } catch {
      // Fall back to sample texts if no content available
      setCurrentPractice(null)
      setCurrentText(getRandomFallbackText())
      setUsingFallback(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPractice()
  }, [fetchPractice])

  // Load fonts on mount
  useEffect(() => {
    installedFonts.forEach((font) => {
      const fontUrl = `https://fonts.googleapis.com/css2?family=${font.replace(
        / /g,
        '+'
      )}:wght@400;500;700&display=swap`
      const existingLink = document.querySelector(
        `link[href*="${font.replace(/ /g, '+')}"]`
      )
      if (!existingLink) {
        const link = document.createElement('link')
        link.href = fontUrl
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
    })
  }, [installedFonts])

  const handleTokenize = useCallback((tokens: Token[]) => {
    setTokenCount(tokens.length)
  }, [])

  const handleFinishReading = useCallback(() => {
    setState('rating')
  }, [])

  const handleRatingSubmit = useCallback(
    async (rating: string, feedback?: string) => {
      // Save rating to backend if we have real content
      if (currentPractice?.content_id) {
        await recordDifficulty(
          currentPractice.content_id,
          rating as 'easy' | 'just_right' | 'hard',
          feedback,
          currentPractice.chunk_index
        )
      }

      // Fetch next content, excluding current
      setTextIndex((prev) => prev + 1)
      setState('reading')
      await fetchPractice(currentPractice?.content_id)
    },
    [currentPractice, fetchPractice, recordDifficulty]
  )

  const handleRatingSkip = useCallback(async () => {
    // Fetch next content without saving rating
    setTextIndex((prev) => prev + 1)
    setState('reading')
    await fetchPractice(currentPractice?.content_id)
  }, [currentPractice, fetchPractice])

  const handleRefresh = useCallback(async () => {
    await fetchPractice(currentPractice?.content_id)
  }, [currentPractice, fetchPractice])

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col">
        {/* Reading State */}
        {state === 'reading' && (
          <>
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-4">
                  <h1 className="text-lg font-semibold">Reader</h1>
                  <span className="text-sm text-muted-foreground">
                    #{textIndex + 1} · {tokenCount} tokens
                    {currentPractice && (
                      <>
                        {' '}· {currentPractice.content_title}
                        {currentPractice.difficulty_estimate !== null && (
                          <> (難易度: {Math.round(currentPractice.difficulty_estimate * 100)}%)</>
                        )}
                      </>
                    )}
                  </span>
                  {usingFallback && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                      <AlertCircle className="h-3 w-3" />
                      サンプル
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    title="Get different text"
                    className="h-9 w-9"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <ReaderSettings />
                </div>
              </div>
            </header>

            {/* Reading Content - Full area */}
            <div className="flex-1 p-8 md:p-12 lg:p-16 pb-24">
              {isLoading ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Loading...
                </div>
              ) : currentText ? (
                <JapaneseText
                  text={currentText}
                  fontSize={settings.fontSize}
                  lineHeight={settings.lineHeight}
                  fontFamily={settings.fontFamily}
                  showFurigana={settings.showFurigana}
                  showMeanings={settings.showMeanings}
                  colorByPos={settings.colorByPos}
                  posColors={settings.posColors}
                  writingMode={settings.writingMode}
                  onTokenize={handleTokenize}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] gap-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8" />
                  <p>No content available. Import some content to get started.</p>
                </div>
              )}
            </div>

            {/* Next Button - Fixed bottom right */}
            <div className="fixed bottom-6 right-6 z-20">
              <Button
                onClick={handleFinishReading}
                disabled={isLoading || !currentText}
                size="lg"
                className="gap-2 px-6 shadow-lg"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {/* Rating State */}
        {state === 'rating' && (
          <DifficultyRating
            onSubmit={handleRatingSubmit}
            onSkip={handleRatingSkip}
          />
        )}
      </div>
    </MainLayout>
  )
}
