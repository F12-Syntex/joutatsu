'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronRight, FileText, BookOpen, Loader2, Trash2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { listContent, getContent, deleteContent } from '@/services/content'
import type { Content, ContentChunk, ContentDetailResponse } from '@/types/content'

interface StoredToken {
  surface: string
  dictionary_form: string
  reading: string
  pos_short: string
  start: number
  end: number
  is_known: boolean
}

export function ContentExplorer() {
  const [contents, setContents] = useState<Content[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadContents = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await listContent({ limit: 100 })
      setContents(response.items)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContents()
  }, [loadContents])

  const handleSelectContent = useCallback(async (content: Content) => {
    try {
      setIsLoadingDetail(true)
      const detail = await getContent(content.id)
      setSelectedContent(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content detail')
    } finally {
      setIsLoadingDetail(false)
    }
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    try {
      await deleteContent(id)
      setContents((prev) => prev.filter((c) => c.id !== id))
      if (selectedContent?.content.id === id) {
        setSelectedContent(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content')
    }
  }, [selectedContent])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Content List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Content Library</CardTitle>
          <CardDescription>{contents.length} items</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-1 p-4 pt-0">
              {contents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No content imported yet
                </p>
              ) : (
                contents.map((content) => (
                  <ContentListItem
                    key={content.id}
                    content={content}
                    isSelected={selectedContent?.content.id === content.id}
                    onSelect={() => handleSelectContent(content)}
                    onDelete={() => handleDelete(content.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Content Detail */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Content Detail</CardTitle>
          <CardDescription>
            {selectedContent
              ? selectedContent.content.title
              : 'Select content to view details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedContent ? (
            <ContentDetail detail={selectedContent} />
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-20" />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="lg:col-span-3 text-sm text-destructive">{error}</div>
      )}
    </div>
  )
}

function ContentListItem({
  content,
  isSelected,
  onSelect,
  onDelete,
}: {
  content: Content
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const Icon = content.source_type === 'PDF' ? BookOpen : FileText

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
        isSelected ? 'bg-accent' : 'hover:bg-muted'
      }`}
      onClick={onSelect}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{content.title}</p>
        <p className="text-xs text-muted-foreground">
          {content.chunk_count} chunks · {content.total_tokens.toLocaleString()} tokens
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

function ContentDetail({ detail }: { detail: ContentDetailResponse }) {
  const { content, chunks } = detail

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tokens" value={content.total_tokens.toLocaleString()} />
        <StatCard label="Unique Vocabulary" value={content.unique_vocabulary.toLocaleString()} />
        <StatCard label="Chunks" value={content.chunk_count.toString()} />
        <StatCard
          label="Difficulty"
          value={content.difficulty_estimate?.toFixed(2) ?? 'N/A'}
        />
      </div>

      <Separator />

      {/* Chunks */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Chunks ({chunks.length})</h4>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {chunks.map((chunk) => (
              <ChunkItem key={chunk.id} chunk={chunk} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function ChunkItem({ chunk }: { chunk: ContentChunk }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasTokens = chunk.tokenized_json && chunk.tokenized_json !== 'null'
  const tokens = hasTokens ? JSON.parse(chunk.tokenized_json!) : []

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer">
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                #{chunk.chunk_index}
              </Badge>
              {chunk.page_number !== null && (
                <Badge variant="secondary" className="text-xs">
                  Page {chunk.page_number}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {chunk.raw_text.length} chars
                {hasTokens && ` · ${tokens.length} tokens`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {chunk.raw_text.slice(0, 100)}...
            </p>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 ml-6 space-y-3">
          {/* Raw Text */}
          <div>
            <p className="text-xs font-medium mb-1">Raw Text</p>
            <ScrollArea className="h-[120px]">
              <pre className="text-xs bg-muted/30 p-2 rounded whitespace-pre-wrap">
                {chunk.raw_text}
              </pre>
            </ScrollArea>
          </div>

          {/* Tokenized Data */}
          {hasTokens && (
            <div>
              <p className="text-xs font-medium mb-1">Tokens ({tokens.length})</p>
              <ScrollArea className="h-[150px]">
                <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded">
                  {tokens.map((token: StoredToken, i: number) => (
                    <TokenBadge key={i} token={token} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TokenBadge({ token }: { token: StoredToken }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="relative">
      <Badge
        variant={token.is_known ? 'default' : 'secondary'}
        className="cursor-pointer text-xs"
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
      >
        {token.surface}
      </Badge>
      {showDetail && (
        <div className="absolute z-50 bottom-full left-0 mb-1 p-2 bg-popover border rounded-md shadow-lg text-xs min-w-[150px]">
          <div className="space-y-1">
            <p><span className="text-muted-foreground">Dict:</span> {token.dictionary_form}</p>
            <p><span className="text-muted-foreground">Reading:</span> {token.reading}</p>
            <p><span className="text-muted-foreground">POS:</span> {token.pos_short}</p>
            <p><span className="text-muted-foreground">Position:</span> {token.start}-{token.end}</p>
          </div>
        </div>
      )}
    </div>
  )
}
