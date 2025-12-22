'use client'

import { CheckCircle, XCircle, Loader2, X, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Download } from '@/types/online-video'

interface DownloadItemProps {
  download: Download
  onDelete: (id: number) => void
  onPlay?: (download: Download) => void
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  )

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function DownloadItem({ download, onDelete, onPlay }: DownloadItemProps) {
  const statusIcon = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    downloading: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
  }[download.status]

  const statusText = {
    pending: 'Pending',
    downloading: `Downloading ${Math.round(download.progress * 100)}%`,
    completed: 'Completed',
    failed: download.error_message || 'Failed',
  }[download.status]

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-muted">
        {download.thumbnail_url && (
          <img
            src={download.thumbnail_url}
            alt={download.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium">{download.title}</h4>
        <div className="mt-1 flex items-center gap-2">
          {statusIcon}
          <span className="text-xs text-muted-foreground">{statusText}</span>
          {download.retry_count > 0 && (
            <span className="text-xs text-yellow-600">
              (Retry {download.retry_count}/3)
            </span>
          )}
        </div>

        {download.status === 'downloading' && (
          <Progress value={download.progress * 100} className="mt-2 h-1" />
        )}

        {download.completed_at && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTimeAgo(download.completed_at)}
          </p>
        )}
      </div>

      <div className="flex gap-1">
        {download.status === 'completed' && onPlay && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPlay(download)}
            title="Open in player"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(download.id)}
          title="Delete"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
