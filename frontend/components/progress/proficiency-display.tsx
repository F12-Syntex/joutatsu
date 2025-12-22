'use client'

import { Gauge, Clock, BookText, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ProficiencyStats, ReaderRecommendations } from '@/services/api'

const levelLabels: Record<string, { label: string; color: string; jlpt: string }> = {
  beginner: { label: 'Beginner', color: 'text-blue-500', jlpt: 'N5' },
  elementary: { label: 'Elementary', color: 'text-green-500', jlpt: 'N4' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-500', jlpt: 'N3' },
  upper_intermediate: { label: 'Upper Intermediate', color: 'text-orange-500', jlpt: 'N2' },
  advanced: { label: 'Advanced', color: 'text-red-500', jlpt: 'N1' },
}

interface ProficiencyDisplayProps {
  stats: ProficiencyStats | null
  recommendations: ReaderRecommendations | null
  isLoading: boolean
  className?: string
}

export function ProficiencyDisplay({
  stats,
  recommendations,
  isLoading,
  className,
}: ProficiencyDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn('p-6 rounded-xl bg-card border border-border/50', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={cn('p-6 rounded-xl bg-card border border-border/50', className)}>
        <div className="text-center py-8 text-muted-foreground">
          Start reading to track your proficiency!
        </div>
      </div>
    )
  }

  const levelInfo = levelLabels[stats.level] || levelLabels.beginner

  return (
    <div className={cn('p-6 rounded-xl bg-card border border-border/50', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Proficiency Level</h3>
        <Gauge className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Level Badge */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={cn(
            'text-4xl font-bold',
            levelInfo.color
          )}
        >
          {levelInfo.jlpt}
        </div>
        <div>
          <div className={cn('text-lg font-medium', levelInfo.color)}>
            {levelInfo.label}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on your reading behavior
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <BookText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Characters Read</span>
          </div>
          <div className="text-xl font-semibold">
            {stats.total_characters_read.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Time Reading</span>
          </div>
          <div className="text-xl font-semibold">
            {stats.total_reading_time_minutes} min
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Lookup Rate</span>
          </div>
          <div className="text-xl font-semibold">
            {stats.lookup_rate}
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Reading Speed</span>
          </div>
          <div className="text-xl font-semibold">
            {stats.reading_speed}
            <span className="text-sm text-muted-foreground"> cpm</span>
          </div>
        </div>
      </div>

      {/* Recommendations Preview */}
      {recommendations && (
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground mb-2">
            Auto-adjusted reader settings
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              Furigana: {recommendations.show_furigana}
            </span>
            {recommendations.show_meanings && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                Show meanings
              </span>
            )}
            {recommendations.highlight_unknown && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                Highlight unknown
              </span>
            )}
          </div>
        </div>
      )}

      {/* Difficulty Ratings Summary */}
      {(stats.easy_ratings > 0 || stats.just_right_ratings > 0 || stats.hard_ratings > 0) && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground mb-2">
            Content difficulty feedback
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">Easy:</span>
              <span>{stats.easy_ratings}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-500">Just right:</span>
              <span>{stats.just_right_ratings}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-orange-500">Hard:</span>
              <span>{stats.hard_ratings}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
