'use client'

import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ScoreDisplay({
  score,
  size = 'md',
  showLabel = false,
  className,
}: ScoreDisplayProps) {
  const percentage = Math.round(score * 100)
  const circumference = 2 * Math.PI * 45

  // Determine color based on score
  const getColor = () => {
    if (score >= 0.7) return 'text-green-500'
    if (score >= 0.4) return 'text-yellow-500'
    return 'text-red-500'
  }

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score)}
            className={cn('transition-all duration-500', getColor())}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', textSizes[size], getColor())}>
            {percentage}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Mastery</span>
      )}
    </div>
  )
}
