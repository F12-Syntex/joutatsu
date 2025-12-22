'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, BookOpen, Download, User, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  searchAozoraWorks,
  getAozoraAuthors,
  importAozoraWork,
  type AozoraWork,
  type AozoraAuthor,
} from '@/services/api'

interface AozoraBrowserProps {
  onImport?: (contentId: number) => void
  className?: string
}

export function AozoraBrowser({ onImport, className }: AozoraBrowserProps) {
  const [query, setQuery] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState<AozoraAuthor | null>(null)
  const [works, setWorks] = useState<AozoraWork[]>([])
  const [authors, setAuthors] = useState<AozoraAuthor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(true)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load popular authors on mount
  useEffect(() => {
    async function loadAuthors() {
      try {
        const response = await getAozoraAuthors()
        setAuthors(response.authors.slice(0, 20))
      } catch (e) {
        console.error('Failed to load authors:', e)
      } finally {
        setIsLoadingAuthors(false)
      }
    }
    loadAuthors()
  }, [])

  // Search works
  const handleSearch = useCallback(async () => {
    if (!query && !selectedAuthor) {
      setWorks([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await searchAozoraWorks({
        query,
        authorId: selectedAuthor?.author_id,
        limit: 30,
      })
      setWorks(response.works)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [query, selectedAuthor])

  // Search on enter or button click
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Select author and search their works
  const handleAuthorClick = async (author: AozoraAuthor) => {
    setSelectedAuthor(author)
    setQuery('')
    setIsLoading(true)
    setError(null)

    try {
      // Show all works by this author (including old orthography)
      const response = await searchAozoraWorks({
        authorId: author.author_id,
        limit: 30,
        modernOnly: false,
      })
      setWorks(response.works)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Import work
  const handleImport = async (work: AozoraWork, uniqueKey: string) => {
    setImportingId(uniqueKey)
    setError(null)

    try {
      const content = await importAozoraWork(work.work_id, true)
      onImport?.(content.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {/* Author filter display */}
      {selectedAuthor && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedAuthor(null)
              setWorks([])
            }}
          >
            {selectedAuthor.author_name} ×
          </Button>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Results / Authors */}
      <div className="flex-1 overflow-y-auto">
        {works.length > 0 ? (
          <div className="space-y-2">
            {works.filter(w => w.work_id).map((work, index) => {
              // Use composite key to handle duplicate work_ids
              const uniqueKey = `${work.work_id}-${work.title}-${index}`
              const isImporting = importingId === uniqueKey
              return (
                <div
                  key={uniqueKey}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg bg-card border transition-colors',
                    isImporting
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg shrink-0',
                      isImporting ? 'bg-primary/20' : 'bg-primary/10'
                    )}>
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">{work.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {work.author_name}
                        {work.first_published && ` · ${work.first_published}`}
                      </p>
                      {isImporting && (
                        <p className="text-xs text-primary mt-0.5">Importing...</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleImport(work, uniqueKey)}
                    disabled={isImporting}
                    className="shrink-0"
                  >
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        ) : !isLoading && !query && !selectedAuthor ? (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Popular Authors
            </h3>
            {isLoadingAuthors ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {authors.map((author) => (
                  <button
                    key={author.author_id}
                    onClick={() => handleAuthorClick(author)}
                    className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors text-left"
                  >
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {author.author_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {author.work_count} works
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {query || selectedAuthor
              ? 'No works found. Try a different search.'
              : 'Search for works or select an author.'}
          </div>
        ) : null}
      </div>
    </div>
  )
}
