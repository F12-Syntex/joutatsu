'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronRight, RefreshCw } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { JapaneseText } from '@/components/japanese-text'
import { Button } from '@/components/ui/button'
import { ReaderSettings, DifficultyRating } from '@/components/reader'
import { useReaderStore } from '@/stores/reader-store'
import type { Token } from '@/types/token'

type ReaderState = 'reading' | 'rating'

// Sample texts for now - will be replaced with backend generation
const sampleTexts = [
  '日本語を勉強しています。毎日少しずつ上達しています。',
  '東京都は今年、新しい環境政策を発表しました。この政策により、二酸化炭素の排出量を大幅に削減することが期待されています。',
  '昔々、山の奥に小さな村がありました。その村には、不思議な力を持つ老人が住んでいました。村人たちは彼のことを「山の仙人」と呼んでいました。',
  '桜の季節になると、多くの人々が公園に集まります。美しい花を見ながら、友人や家族と楽しい時間を過ごします。',
  '日本の伝統的な食文化は、世界中で高く評価されています。特に寿司や天ぷらは、海外でも人気があります。',
  '電車の中では、静かにすることがマナーとされています。携帯電話での通話は控えめにしましょう。',
  '富士山は日本で最も高い山で、その美しさは古くから多くの芸術家に影響を与えてきました。',
  '最近、リモートワークが普及し、働き方が大きく変わりました。自宅で仕事をする人が増えています。',
]

function getRandomText(excludeText?: string): string {
  const available = excludeText
    ? sampleTexts.filter((t) => t !== excludeText)
    : sampleTexts
  return available[Math.floor(Math.random() * available.length)]
}

export default function ReaderPage() {
  const [state, setState] = useState<ReaderState>('reading')
  const [currentText, setCurrentText] = useState('')
  const [tokenCount, setTokenCount] = useState(0)
  const [textIndex, setTextIndex] = useState(0)
  const { settings, installedFonts } = useReaderStore()

  // Generate initial text on mount
  useEffect(() => {
    setCurrentText(getRandomText())
  }, [])

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
    (rating: string, feedback?: string) => {
      console.log('Rating:', rating, feedback)
      // TODO: Save rating to backend and use for adaptive difficulty

      // Generate next text
      setCurrentText(getRandomText(currentText))
      setTextIndex((prev) => prev + 1)
      setState('reading')
    },
    [currentText]
  )

  const handleRatingSkip = useCallback(() => {
    // Generate next text without saving rating
    setCurrentText(getRandomText(currentText))
    setTextIndex((prev) => prev + 1)
    setState('reading')
  }, [currentText])

  const handleRefresh = useCallback(() => {
    setCurrentText(getRandomText(currentText))
  }, [currentText])

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
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    title="Get different text"
                    className="h-9 w-9"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <ReaderSettings />
                </div>
              </div>
            </header>

            {/* Reading Content - Full area */}
            <div className="flex-1 p-8 md:p-12 lg:p-16 pb-24">
              {currentText ? (
                <JapaneseText
                  text={currentText}
                  fontSize={settings.fontSize}
                  lineHeight={settings.lineHeight}
                  fontFamily={settings.fontFamily}
                  showFurigana={settings.showFurigana}
                  colorByPos={settings.colorByPos}
                  posColors={settings.posColors}
                  onTokenize={handleTokenize}
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Loading...
                </div>
              )}
            </div>

            {/* Next Button - Fixed bottom right */}
            <div className="fixed bottom-6 right-6 z-20">
              <Button
                onClick={handleFinishReading}
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
