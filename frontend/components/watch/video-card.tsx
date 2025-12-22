'use client'

import { Video, Subtitles, HardDrive } from 'lucide-react'
import type { VideoFile } from '@/types/video'

interface VideoCardProps {
  video: VideoFile
  onSelect: () => void
}

export function VideoCard({ video, onSelect }: VideoCardProps) {
  const formattedSize = formatFileSize(video.size)

  return (
    <button
      onClick={onSelect}
      className="group relative text-left w-full"
    >
      <div className="relative aspect-video rounded-xl border border-border/50 overflow-hidden bg-secondary/30 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Placeholder with icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-12 w-12 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
        </div>

        {/* Subtitle indicator */}
        {video.hasSubtitle && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium">
            <Subtitles className="h-3 w-3" />
            {video.subtitleFormat?.toUpperCase()}
          </div>
        )}

        {/* File size */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 text-xs text-muted-foreground">
          <HardDrive className="h-3 w-3" />
          {formattedSize}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {video.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatDate(video.lastModified)}
        </p>
      </div>
    </button>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
