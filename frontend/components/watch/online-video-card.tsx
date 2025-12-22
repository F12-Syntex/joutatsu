'use client'

import { useState } from 'react'
import { Download, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { OnlineVideo } from '@/types/online-video'

interface OnlineVideoCardProps {
  video: OnlineVideo
  onDownload: (video: OnlineVideo) => void
  isDownloading?: boolean
}

function formatDuration(seconds?: number): string {
  if (!seconds) return 'Unknown'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function OnlineVideoCard({
  video,
  onDownload,
  isDownloading,
}: OnlineVideoCardProps) {
  const [isHovering, setIsHovering] = useState(false)

  const hasManualJaSubs = video.subtitles.some((lang) =>
    lang.startsWith('ja')
  )
  const hasAutoJaSubs = video.automatic_captions.some((lang) =>
    lang.startsWith('ja')
  )

  return (
    <Card
      className="group relative overflow-hidden transition-shadow hover:shadow-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
            <Clock className="mr-1 inline h-3 w-3" />
            {formatDuration(video.duration)}
          </div>
        )}
        {isHovering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Button
              onClick={() => onDownload(video)}
              disabled={isDownloading}
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
          {video.title}
        </h3>
        {video.channel && (
          <p className="mt-1 text-xs text-muted-foreground">{video.channel}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {hasManualJaSubs && (
            <Badge variant="default" className="text-xs">
              Japanese Subs
            </Badge>
          )}
          {!hasManualJaSubs && hasAutoJaSubs && (
            <Badge variant="secondary" className="text-xs">
              Auto-generated
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
