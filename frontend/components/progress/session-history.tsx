'use client'

import Link from 'next/link'
import { BookOpen, Clock, Eye } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { SessionWithContent } from '@/services/api'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface SessionHistoryProps {
  sessions: SessionWithContent[]
  className?: string
}

export function SessionHistory({ sessions, className }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No reading sessions yet. Start reading to track your progress!
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {sessions.map((session) => {
        const startedAt = new Date(session.started_at)
        const endedAt = session.ended_at ? new Date(session.ended_at) : null
        const duration = endedAt
          ? Math.round((endedAt.getTime() - startedAt.getTime()) / 1000 / 60)
          : null

        return (
          <Link
            key={session.id}
            href={`/library/${session.content_id}`}
            className="block p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm line-clamp-1">
                    {session.content_title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(startedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {duration !== null && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{duration}m</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{session.lookups_count} lookups</span>
                </div>
              </div>
            </div>
            {session.tokens_read > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {session.tokens_read} tokens read
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
