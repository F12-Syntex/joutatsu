'use client'

import type { VideoFile } from '@/types/video'
import { VideoCard } from './video-card'

interface VideoListProps {
  videos: VideoFile[]
  onSelect: (video: VideoFile) => void
}

export function VideoList({ videos, onSelect }: VideoListProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {videos.map((video) => (
        <VideoCard
          key={video.name}
          video={video}
          onSelect={() => onSelect(video)}
        />
      ))}
    </div>
  )
}
