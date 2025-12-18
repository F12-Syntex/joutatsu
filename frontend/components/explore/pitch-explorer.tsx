'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, Database } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PitchPattern {
  kanji: string
  pattern: string
}

interface PitchSearchResult {
  reading: string
  patterns: PitchPattern[]
}

export function PitchExplorer() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'exact' | 'search'>('exact')
  const [isLoading, setIsLoading] = useState(false)
  const [exactResult, setExactResult] = useState<{ reading: string; patterns: PitchPattern[] } | null>(null)
  const [searchResults, setSearchResults] = useState<PitchSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setLastQuery(query)

    try {
      if (mode === 'exact') {
        const res = await fetch(`${API_BASE}/api/data/pitch?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error('Lookup failed')
        const data = await res.json()
        setExactResult(data)
        setSearchResults([])
      } else {
        const res = await fetch(`${API_BASE}/api/data/pitch/search?q=${encodeURIComponent(query)}&limit=50`)
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        setSearchResults(data.results)
        setExactResult(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
      setExactResult(null)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [query, mode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pitch Accent Lookup</CardTitle>
          <CardDescription>
            Search Kanjium pitch accent data (124k+ entries)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'exact' | 'search')}>
            <TabsList>
              <TabsTrigger value="exact">Exact Match</TabsTrigger>
              <TabsTrigger value="search">Partial Search</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Input
              placeholder={mode === 'exact' ? 'Enter reading (e.g., タベル)' : 'Search partial match'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-lg"
            />
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Pitch pattern reference */}
          <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
            <p className="font-medium">Pitch pattern reference:</p>
            <ul className="text-muted-foreground space-y-0.5">
              <li><span className="font-mono">0</span> = 平板 (heiban) - flat, no drop</li>
              <li><span className="font-mono">1</span> = 頭高 (atamadaka) - drops after first mora</li>
              <li><span className="font-mono">2+</span> = 中高/尾高 (nakadaka/odaka) - drops after nth mora</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Exact Match Results */}
      {mode === 'exact' && exactResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Results for &ldquo;{lastQuery}&rdquo;
            </CardTitle>
            <CardDescription>
              {exactResult.patterns.length} pattern{exactResult.patterns.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exactResult.patterns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 opacity-20 mb-2" />
                <p>No pitch patterns found for this reading</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exactResult.patterns.map((pattern, i) => (
                  <PitchCard
                    key={i}
                    reading={exactResult.reading}
                    kanji={pattern.kanji}
                    pattern={pattern.pattern}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {mode === 'search' && searchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Search results for &ldquo;{lastQuery}&rdquo;
            </CardTitle>
            <CardDescription>
              {searchResults.length} reading{searchResults.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {searchResults.map((result, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-lg font-medium">{result.reading}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {result.patterns.map((pattern, j) => (
                        <PitchCard
                          key={j}
                          reading={result.reading}
                          kanji={pattern.kanji}
                          pattern={pattern.pattern}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PitchCard({
  reading,
  kanji,
  pattern,
  compact = false,
}: {
  reading: string
  kanji: string
  pattern: string
  compact?: boolean
}) {
  // Convert reading to array of mora for visualization
  const morae = readingToMorae(reading)
  const patternNum = parseInt(pattern, 10)

  return (
    <div className={`p-3 border rounded-lg ${compact ? '' : 'space-y-3'}`}>
      <div className="flex items-center justify-between">
        <div>
          {kanji && <p className="text-lg font-bold">{kanji}</p>}
          <p className={`${kanji ? 'text-muted-foreground' : 'text-lg font-bold'}`}>
            {reading}
          </p>
        </div>
        <Badge variant="outline" className="text-lg font-mono">
          {pattern}
        </Badge>
      </div>

      {!compact && (
        <div className="pt-2">
          <PitchVisual morae={morae} dropAfter={patternNum} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {getPitchDescription(patternNum, morae.length)}
      </p>
    </div>
  )
}

function PitchVisual({ morae, dropAfter }: { morae: string[]; dropAfter: number }) {
  // Generate pitch heights
  const heights = morae.map((_, i) => {
    if (dropAfter === 0) {
      // Heiban: low first mora, high rest
      return i === 0 ? 'low' : 'high'
    } else if (dropAfter === 1) {
      // Atamadaka: high first mora, low rest
      return i === 0 ? 'high' : 'low'
    } else {
      // Nakadaka/Odaka: low first, high until drop
      if (i === 0) return 'low'
      if (i < dropAfter) return 'high'
      return 'low'
    }
  })

  return (
    <div className="flex items-end gap-0.5">
      {morae.map((mora, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className={`w-8 h-8 flex items-center justify-center border rounded text-sm font-medium transition-all ${
              heights[i] === 'high'
                ? 'bg-primary text-primary-foreground -translate-y-2'
                : 'bg-muted'
            }`}
          >
            {mora}
          </div>
          {i < morae.length - 1 && (
            <div className="h-4 flex items-center">
              {heights[i] !== heights[i + 1] && (
                <div className={`w-4 h-0.5 ${heights[i] === 'high' ? 'bg-red-500' : 'bg-green-500'}`} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function readingToMorae(reading: string): string[] {
  const morae: string[] = []
  const smallKana = 'ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ'

  for (let i = 0; i < reading.length; i++) {
    const char = reading[i]
    const next = reading[i + 1]

    if (next && smallKana.includes(next)) {
      morae.push(char + next)
      i++
    } else {
      morae.push(char)
    }
  }

  return morae
}

function getPitchDescription(pattern: number, moraCount: number): string {
  if (pattern === 0) {
    return '平板型 (heiban) - flat pattern, no pitch drop'
  } else if (pattern === 1) {
    return '頭高型 (atamadaka) - drops after first mora'
  } else if (pattern === moraCount) {
    return '尾高型 (odaka) - drops after final mora'
  } else {
    return `中高型 (nakadaka) - drops after mora ${pattern}`
  }
}
