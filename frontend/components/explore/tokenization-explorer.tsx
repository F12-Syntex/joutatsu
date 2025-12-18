'use client'

import { useState, useCallback } from 'react'
import { Loader2, Play } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { tokenizeText, analyzeText, type Token } from '@/services/api'

interface AnalysisResult {
  surface: string
  dictionary_form: string
  reading: string
  pos: string
  dictionary: { kanji: string[]; kana: string[]; glosses: string[] }[]
  pitch: { kanji: string; pattern: string }[]
}

export function TokenizationExplorer() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'A' | 'B' | 'C'>('C')
  const [analysisMode, setAnalysisMode] = useState<'tokenize' | 'analyze'>('tokenize')
  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleTokenize = useCallback(async () => {
    if (!text.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      if (analysisMode === 'tokenize') {
        const result = await tokenizeText(text, mode)
        setTokens(result.tokens)
        setAnalysis([])
      } else {
        const result = await analyzeText(text)
        setAnalysis(result.analysis)
        setTokens([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tokenization failed')
      setTokens([])
      setAnalysis([])
    } finally {
      setIsLoading(false)
    }
  }, [text, mode, analysisMode])

  return (
    <div className="space-y-6">
      {/* Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tokenization</CardTitle>
          <CardDescription>
            Analyze Japanese text with SudachiPy morphological analyzer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter Japanese text to tokenize (e.g., 日本語を勉強しています)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px] text-lg"
          />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mode:</span>
              <Select value={analysisMode} onValueChange={(v) => setAnalysisMode(v as 'tokenize' | 'analyze')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tokenize">Tokenize</SelectItem>
                  <SelectItem value="analyze">Full Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {analysisMode === 'tokenize' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Split:</span>
                <Select value={mode} onValueChange={(v) => setMode(v as 'A' | 'B' | 'C')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Short units</SelectItem>
                    <SelectItem value="B">B - Medium units</SelectItem>
                    <SelectItem value="C">C - Long units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleTokenize} disabled={isLoading || !text.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {analysisMode === 'tokenize' ? 'Tokenize' : 'Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Results */}
      {(tokens.length > 0 || analysis.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Results ({tokens.length || analysis.length} tokens)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {analysisMode === 'tokenize' ? (
                <TokenResults tokens={tokens} />
              ) : (
                <AnalysisResults analysis={analysis} />
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TokenResults({ tokens }: { tokens: Token[] }) {
  return (
    <div className="space-y-2">
      {/* Visual representation */}
      <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg mb-4">
        {tokens.map((token, i) => (
          <Badge key={i} variant="outline" className="text-base px-2 py-1">
            {token.surface}
          </Badge>
        ))}
      </div>

      {/* Detailed table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-medium">Surface</th>
              <th className="text-left p-2 font-medium">Dictionary</th>
              <th className="text-left p-2 font-medium">Reading</th>
              <th className="text-left p-2 font-medium">POS</th>
              <th className="text-left p-2 font-medium">Pitch</th>
              <th className="text-left p-2 font-medium">Position</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="p-2 font-medium">{token.surface}</td>
                <td className="p-2">{token.dictionary_form}</td>
                <td className="p-2 text-muted-foreground">{token.reading}</td>
                <td className="p-2">
                  <Badge variant="secondary" className="text-xs">
                    {token.pos_short}
                  </Badge>
                </td>
                <td className="p-2">
                  {token.pitch.length > 0 ? (
                    <span className="font-mono text-xs">
                      {token.pitch.map((p) => p.pattern).join(', ')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-2 font-mono text-xs text-muted-foreground">
                  {token.start}-{token.end}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AnalysisResults({ analysis }: { analysis: AnalysisResult[] }) {
  return (
    <div className="space-y-4">
      {analysis.map((item, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold">{item.surface}</p>
              {item.surface !== item.dictionary_form && (
                <p className="text-muted-foreground">
                  → {item.dictionary_form}
                </p>
              )}
            </div>
            <Badge variant="secondary">{item.pos}</Badge>
          </div>

          {/* Reading */}
          <p className="text-lg text-muted-foreground">{item.reading}</p>

          {/* Pitch */}
          {item.pitch.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.pitch.map((p, j) => (
                <Badge key={j} variant="outline" className="font-mono text-xs">
                  {p.kanji || item.reading}: {p.pattern}
                </Badge>
              ))}
            </div>
          )}

          {/* Dictionary entries */}
          {item.dictionary.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Dictionary entries:</p>
                {item.dictionary.map((entry, j) => (
                  <div key={j} className="pl-4 text-sm">
                    <p className="text-muted-foreground">
                      {entry.kanji.length > 0 && (
                        <span className="font-medium text-foreground">
                          {entry.kanji.join('、')}
                        </span>
                      )}
                      {entry.kanji.length > 0 && entry.kana.length > 0 && ' '}
                      {entry.kana.length > 0 && `(${entry.kana.join('、')})`}
                    </p>
                    <p>{entry.glosses.join('; ')}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
