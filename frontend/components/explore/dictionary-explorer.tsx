'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, BookOpen } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { lookupWord, lookupKanji, type DictionaryEntry, type KanjiEntry } from '@/services/api'

export function DictionaryExplorer() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'word' | 'kanji'>('word')
  const [isLoading, setIsLoading] = useState(false)
  const [wordResults, setWordResults] = useState<DictionaryEntry[]>([])
  const [kanjiResults, setKanjiResults] = useState<KanjiEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setLastQuery(query)

    try {
      if (mode === 'word') {
        const result = await lookupWord(query, 20)
        setWordResults(result.entries)
        setKanjiResults([])
      } else {
        const result = await lookupKanji(query)
        setKanjiResults(result.characters)
        setWordResults([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
      setWordResults([])
      setKanjiResults([])
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
          <CardTitle className="text-lg">Dictionary Lookup</CardTitle>
          <CardDescription>Search JMdict for words or kanji</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'word' | 'kanji')}>
            <TabsList>
              <TabsTrigger value="word">Word</TabsTrigger>
              <TabsTrigger value="kanji">Kanji</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Input
              placeholder={mode === 'word' ? 'Enter word (e.g., 食べる)' : 'Enter kanji (e.g., 食)'}
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
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {lastQuery && !error && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Results for &ldquo;{lastQuery}&rdquo;
            </CardTitle>
            <CardDescription>
              {mode === 'word'
                ? `${wordResults.length} word entries`
                : `${kanjiResults.length} kanji entries`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {mode === 'word' ? (
                <WordResults entries={wordResults} />
              ) : (
                <KanjiResults entries={kanjiResults} />
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WordResults({ entries }: { entries: DictionaryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 opacity-20 mb-2" />
        <p>No results found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <WordEntry key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

function WordEntry({ entry }: { entry: DictionaryEntry }) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      {/* Header: Kanji and Readings */}
      <div>
        {entry.kanji.length > 0 && (
          <p className="text-2xl font-bold">{entry.kanji.join('、')}</p>
        )}
        <p className="text-lg text-muted-foreground">
          {entry.readings.join('、')}
        </p>
      </div>

      {/* Pitch Accent */}
      {entry.pitch && entry.pitch.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.pitch.map((p, i) => (
            <Badge key={i} variant="outline" className="text-xs font-mono">
              {p.kanji || entry.readings[0]}: {p.pattern}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Senses/Definitions */}
      <div className="space-y-2">
        {entry.senses.map((sense, i) => (
          <div key={i} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0">{i + 1}.</span>
              <div>
                {sense.pos.length > 0 && (
                  <span className="text-xs text-blue-500 mr-2">
                    [{sense.pos.join(', ')}]
                  </span>
                )}
                <span>{sense.glosses.join('; ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Entry ID */}
      <p className="text-xs text-muted-foreground">JMdict ID: {entry.id}</p>
    </div>
  )
}

function KanjiResults({ entries }: { entries: KanjiEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 opacity-20 mb-2" />
        <p>No kanji found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <KanjiEntryCard key={entry.literal} entry={entry} />
      ))}
    </div>
  )
}

function KanjiEntryCard({ entry }: { entry: KanjiEntry }) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      {/* Kanji Character */}
      <div className="flex items-start gap-4">
        <div className="text-6xl font-bold shrink-0">{entry.literal}</div>
        <div className="space-y-2">
          {/* Meanings */}
          <p className="text-lg">{entry.meanings.join(', ')}</p>

          {/* Readings */}
          <div className="space-y-1">
            {entry.readings.on.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-xs">音</Badge>
                <span>{entry.readings.on.join('、')}</span>
              </div>
            )}
            {entry.readings.kun.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">訓</Badge>
                <span>{entry.readings.kun.join('、')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Strokes: </span>
          <span className="font-medium">{entry.stroke_count}</span>
        </div>
        {entry.grade && (
          <div>
            <span className="text-muted-foreground">Grade: </span>
            <span className="font-medium">{entry.grade}</span>
          </div>
        )}
        {entry.jlpt && (
          <div>
            <span className="text-muted-foreground">JLPT: </span>
            <span className="font-medium">N{entry.jlpt}</span>
          </div>
        )}
        {entry.frequency && (
          <div>
            <span className="text-muted-foreground">Frequency: </span>
            <span className="font-medium">#{entry.frequency}</span>
          </div>
        )}
      </div>
    </div>
  )
}
