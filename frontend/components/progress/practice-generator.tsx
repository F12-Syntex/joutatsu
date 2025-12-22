'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Copy, Check, BookOpen, MessageSquare, Newspaper, FileText, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { generateText, type GeneratedTextResponse } from '@/services/api'

const genres = [
  { value: 'general', label: 'General', icon: FileText },
  { value: 'story', label: 'Story', icon: BookOpen },
  { value: 'dialogue', label: 'Dialogue', icon: MessageSquare },
  { value: 'news', label: 'News', icon: Newspaper },
] as const

const lengths = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
] as const

interface PracticeGeneratorProps {
  onTextGenerated?: (text: string) => void
  className?: string
}

export function PracticeGenerator({ onTextGenerated, className }: PracticeGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [genre, setGenre] = useState<'general' | 'story' | 'dialogue' | 'news' | 'essay'>('general')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [challengeLevel, setChallengeLevel] = useState(0.1)
  const [useUserLevel, setUseUserLevel] = useState(true)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GeneratedTextResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateText({
        topic: topic || undefined,
        genre,
        length,
        use_user_proficiency: useUserLevel,
        challenge_level: challengeLevel,
      })
      setGeneratedResult(result)
      onTextGenerated?.(result.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedResult) return
    await navigator.clipboard.writeText(generatedResult.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('p-6 rounded-xl bg-card border border-border/50', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Practice Text Generator
        </h3>
      </div>

      <div className="space-y-4">
        {/* Topic input */}
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">
            Topic (optional)
          </label>
          <Input
            placeholder="e.g., cooking, travel, school life..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Genre selection */}
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">
            Genre
          </label>
          <div className="flex gap-2">
            {genres.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setGenre(value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                  genre === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Length selection */}
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">
            Length
          </label>
          <div className="flex rounded-lg bg-muted/40 p-0.5 w-fit">
            {lengths.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLength(value)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                  length === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* User level toggle */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm">Match my skill level</span>
            <p className="text-xs text-muted-foreground">
              Generate text slightly above your current proficiency
            </p>
          </div>
          <button
            onClick={() => setUseUserLevel(!useUserLevel)}
            className={cn(
              'h-6 w-11 rounded-full transition-colors relative',
              useUserLevel ? 'bg-primary' : 'bg-muted'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                useUserLevel ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Challenge level slider */}
        {useUserLevel && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-muted-foreground">
                Challenge level
              </label>
              <span className="text-sm font-medium">
                +{Math.round(challengeLevel * 100)}%
              </span>
            </div>
            <Slider
              value={[challengeLevel]}
              min={0}
              max={0.3}
              step={0.05}
              onValueChange={([v]) => setChallengeLevel(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Comfortable</span>
              <span>Challenging</span>
            </div>
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Practice Text
            </>
          )}
        </Button>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Generated result */}
        {generatedResult && (
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {generatedResult.difficulty_level}
                </span>
                <span>{generatedResult.genre}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-7 w-7"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="h-7 w-7"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isGenerating && 'animate-spin')} />
                </Button>
              </div>
            </div>
            <p className="text-lg leading-relaxed whitespace-pre-wrap font-japanese">
              {generatedResult.text}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
