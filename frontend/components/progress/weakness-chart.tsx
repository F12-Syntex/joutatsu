'use client'

import { cn } from '@/lib/utils'
import type { VocabularyScore } from '@/services/api'

interface WeaknessChartProps {
  words: VocabularyScore[]
  className?: string
}

export function WeaknessChart({ words, className }: WeaknessChartProps) {
  if (words.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No vocabulary tracked yet. Start reading to build your vocabulary!
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {words.map((word) => {
        const percentage = Math.round(word.score * 100)
        const getBarColor = () => {
          if (word.score >= 0.7) return 'bg-green-500'
          if (word.score >= 0.4) return 'bg-yellow-500'
          return 'bg-red-500'
        }

        return (
          <div key={word.vocabulary_id} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {word.dictionary_form}
                </span>
                {word.reading && word.reading !== word.dictionary_form && (
                  <span className="text-xs text-muted-foreground">
                    ({word.reading})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{word.times_looked_up} lookups</span>
                <span className="font-medium">{percentage}%</span>
              </div>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  getBarColor()
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
