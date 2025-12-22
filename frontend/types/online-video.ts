/**
 * Types for online video browsing and downloads
 */

export interface OnlineVideo {
  video_id: string
  title: string
  channel?: string
  duration?: number
  thumbnail?: string
  url: string
  subtitles: string[]
  automatic_captions: string[]
  has_japanese_subs: boolean
}

export interface Download {
  id: number
  video_id: string
  title: string
  thumbnail_url: string
  status: 'pending' | 'downloading' | 'completed' | 'failed'
  progress: number
  file_path?: string
  subtitle_path?: string
  error_message?: string
  retry_count: number
  created_at: string
  completed_at?: string
}

export interface DownloadQueueRequest {
  video_id: string
  title: string
  thumbnail_url: string
}
