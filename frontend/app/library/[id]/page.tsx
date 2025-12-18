'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'
import { JapaneseText } from '@/components/japanese-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ReaderSettings } from '@/components/reader'
import { useLibraryStore } from '@/stores/library-store'
import { useReaderStore } from '@/stores/reader-store'
import { getContentChunk } from '@/services/api'
import type { Book } from '@/types/book'

export default function BookReaderPage() {
  const params = useParams()
  const router = useRouter()
  const { getBook, updateProgress } = useLibraryStore()
  const { settings, installedFonts } = useReaderStore()

  const [book, setBook] = useState<Book | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [jumpToPage, setJumpToPage] = useState('')
  const [chunkContent, setChunkContent] = useState<string | null>(null)
  const [isLoadingChunk, setIsLoadingChunk] = useState(false)
  const chunkCache = useRef<Map<number, string>>(new Map())

  // Load book
  useEffect(() => {
    const id = params.id as string
    const loadedBook = getBook(id)
    if (loadedBook) {
      setBook(loadedBook)
      setCurrentPage(loadedBook.currentPage)
    } else {
      router.push('/library')
    }
  }, [params.id, getBook, router])

  // Load fonts
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

  // Save progress when page changes
  useEffect(() => {
    if (book) {
      updateProgress(book.id, currentPage)
    }
  }, [book, currentPage, updateProgress])

  const goToPage = useCallback(
    (page: number) => {
      if (!book) return
      const newPage = Math.max(1, Math.min(page, book.totalPages))
      setCurrentPage(newPage)
    },
    [book]
  )

  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpToPage, 10)
    if (!isNaN(page)) {
      goToPage(page)
      setJumpToPage('')
    }
  }, [jumpToPage, goToPage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goToPage(currentPage + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPage(currentPage - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, goToPage])

  // Fetch chunk from backend for PDF/backend content
  useEffect(() => {
    if (!book || !book.contentId) return

    const chunkIndex = currentPage - 1 // Backend uses 0-indexed chunks

    // Check cache first
    if (chunkCache.current.has(chunkIndex)) {
      setChunkContent(chunkCache.current.get(chunkIndex)!)
      return
    }

    setIsLoadingChunk(true)
    getContentChunk(book.contentId, chunkIndex)
      .then((chunk) => {
        chunkCache.current.set(chunkIndex, chunk.text)
        setChunkContent(chunk.text)
      })
      .catch((err) => {
        console.error('Failed to load chunk:', err)
        setChunkContent(null)
      })
      .finally(() => {
        setIsLoadingChunk(false)
      })
  }, [book, currentPage])

  if (!book) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  // Get content - either from local pages or from backend chunk
  const localPageContent = book.pages?.find((p) => p.pageNumber === currentPage)?.content
  const displayContent = book.contentId ? chunkContent : localPageContent
  const progress = Math.round((currentPage / book.totalPages) * 100)

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/library')}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-sm font-medium truncate max-w-[200px]">
                  {book.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {book.totalPages}
                </p>
              </div>
            </div>
            <ReaderSettings />
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 md:p-10 lg:p-14 pb-24">
          {isLoadingChunk ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayContent ? (
            <JapaneseText
              text={displayContent}
              fontSize={settings.fontSize}
              lineHeight={settings.lineHeight}
              fontFamily={settings.fontFamily}
              showFurigana={settings.showFurigana}
              colorByPos={settings.colorByPos}
              posColors={settings.posColors}
            />
          ) : (
            <div className="text-muted-foreground">Page not found</div>
          )}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-64 right-0 z-20 bg-background/80 backdrop-blur-sm border-t">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Previous */}
            <Button
              variant="ghost"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page indicator / Jump */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors">
                    {currentPage} / {book.totalPages}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="center">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Jump to page</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={book.totalPages}
                        value={jumpToPage}
                        onChange={(e) => setJumpToPage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                        placeholder={String(currentPage)}
                        className="h-8"
                      />
                      <Button
                        size="sm"
                        onClick={handleJumpToPage}
                        className="h-8"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <span className="text-xs text-muted-foreground">
                {progress}%
              </span>
            </div>

            {/* Next */}
            <Button
              variant="ghost"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= book.totalPages}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
