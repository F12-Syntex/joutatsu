'use client'

import { useState } from 'react'
import { Smile, Meh, Frown, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Difficulty = 'easy' | 'just_right' | 'hard'

interface DifficultyRatingProps {
  onSubmit: (rating: Difficulty, feedback?: string) => void
  onSkip: () => void
}

const ratings: { id: Difficulty; label: string; icon: typeof Smile; color: string }[] = [
  { id: 'easy', label: 'Easy', icon: Smile, color: 'text-emerald-500 hover:bg-emerald-500/10' },
  { id: 'just_right', label: 'Just Right', icon: Meh, color: 'text-blue-500 hover:bg-blue-500/10' },
  { id: 'hard', label: 'Hard', icon: Frown, color: 'text-orange-500 hover:bg-orange-500/10' },
]

export function DifficultyRating({ onSubmit, onSkip }: DifficultyRatingProps) {
  const [selected, setSelected] = useState<Difficulty | null>(null)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const handleSelect = (rating: Difficulty) => {
    setSelected(rating)
    if (rating === 'hard') {
      setShowFeedback(true)
    } else {
      setShowFeedback(false)
    }
  }

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected, feedback || undefined)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">How was it?</h2>
          <p className="text-muted-foreground">
            Rate the difficulty to help calibrate future content
          </p>
        </div>

        {/* Rating Buttons */}
        <div className="flex justify-center gap-4">
          {ratings.map((rating) => {
            const Icon = rating.icon
            const isSelected = selected === rating.id
            return (
              <button
                key={rating.id}
                onClick={() => handleSelect(rating.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all',
                  'hover:scale-105',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                  rating.color
                )}
              >
                <Icon
                  className={cn(
                    'h-12 w-12 transition-transform',
                    isSelected && 'scale-110'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {rating.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Feedback (for "Hard") */}
        {showFeedback && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-sm text-muted-foreground">
              What made it difficult? (optional)
            </p>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Unknown vocabulary, complex grammar, long sentences..."
              className="min-h-[80px] resize-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selected}
            className="gap-2 px-6"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
