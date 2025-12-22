/** Represents a video file in the watch directory */
export interface VideoFile {
  /** Unique identifier (file name) */
  name: string
  /** Full file path/name */
  fileName: string
  /** File handle for reading */
  handle: FileSystemFileHandle
  /** File size in bytes */
  size: number
  /** Last modified timestamp */
  lastModified: number
  /** Whether a matching subtitle file exists */
  hasSubtitle: boolean
  /** Subtitle file handle if exists */
  subtitleHandle?: FileSystemFileHandle
  /** Subtitle format (srt, ass, vtt) */
  subtitleFormat?: 'srt' | 'ass' | 'vtt'
}

/** Supported video extensions */
export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov'] as const

/** Supported subtitle extensions */
export const SUBTITLE_EXTENSIONS = ['.srt', '.ass', '.vtt'] as const

/** Check if a filename is a video file */
export function isVideoFile(name: string): boolean {
  const lower = name.toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Check if a filename is a subtitle file */
export function isSubtitleFile(name: string): boolean {
  const lower = name.toLowerCase()
  return SUBTITLE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Get the base name without extension */
export function getBaseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}
