'use client'

import { OnlineVideoCard } from './online-video-card'
import type { OnlineVideo } from '@/types/online-video'

interface OnlineVideoGridProps {
  videos: OnlineVideo[]
  onDownload: (video: OnlineVideo) => void
  downloadingIds?: string[]
  isLoading?: boolean
}

export function OnlineVideoGrid({
  videos,
  onDownload,
  downloadingIds = [],
  isLoading,
}: OnlineVideoGridProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Searching for videos...</p>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-semibold">No videos found</p>
          <p className="mt-1 text-sm">
            Try searching for Japanese content with subtitles
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <OnlineVideoCard
          key={video.video_id}
          video={video}
          onDownload={onDownload}
          isDownloading={downloadingIds.includes(video.video_id)}
        />
      ))}
    </div>
  )
}
