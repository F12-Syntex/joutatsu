'use client'

import { useCallback } from 'react'
import { FileText, BookOpen, Link as LinkIcon, Trash2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Content, ContentType } from '@/types/content'

interface ContentCardProps {
  content: Content
  onSelect?: (content: Content) => void
  onDelete?: (content: Content) => void
}

const contentTypeIcons: Record<ContentType, typeof FileText> = {
  TEXT: FileText,
  PDF: BookOpen,
  URL: LinkIcon,
  EPUB: BookOpen,
}

const contentTypeLabels: Record<ContentType, string> = {
  TEXT: 'Text',
  PDF: 'PDF',
  URL: 'URL',
  EPUB: 'EPUB',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDifficulty(difficulty: number | null): string {
  if (difficulty === null) return 'Unknown'
  const percent = Math.round(difficulty * 100)
  if (percent < 30) return 'Easy'
  if (percent < 60) return 'Medium'
  return 'Hard'
}

function getDifficultyColor(difficulty: number | null): string {
  if (difficulty === null) return 'secondary'
  if (difficulty < 0.3) return 'success'
  if (difficulty < 0.6) return 'warning'
  return 'destructive'
}

export function ContentCard({ content, onSelect, onDelete }: ContentCardProps) {
  const Icon = contentTypeIcons[content.source_type] || FileText

  const handleClick = useCallback(() => {
    onSelect?.(content)
  }, [content, onSelect])

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.(content)
    },
    [content, onDelete]
  )

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{content.title}</CardTitle>
            <CardDescription className="mt-1">
              {formatDate(content.created_at)}
            </CardDescription>
          </div>
        </div>
        {onDelete && (
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {contentTypeLabels[content.source_type]}
          </Badge>
          <Badge variant={getDifficultyColor(content.difficulty_estimate) as 'secondary' | 'default' | 'destructive' | 'outline'}>
            {formatDifficulty(content.difficulty_estimate)}
          </Badge>
          <Badge variant="outline">
            {content.chunk_count} {content.chunk_count === 1 ? 'chunk' : 'chunks'}
          </Badge>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <span>{content.total_tokens.toLocaleString()} tokens</span>
          <span className="mx-2">·</span>
          <span>{content.unique_vocabulary.toLocaleString()} unique words</span>
        </div>
      </CardContent>
    </Card>
  )
}
