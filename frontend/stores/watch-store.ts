import { create } from 'zustand'
import type { VideoFile } from '@/types/video'
import { isVideoFile, isSubtitleFile, getBaseName } from '@/types/video'

interface WatchStore {
  /** Directory handle for the video folder */
  directoryHandle: FileSystemDirectoryHandle | null
  /** Directory name for display */
  directoryName: string | null
  /** List of video files in the directory */
  videos: VideoFile[]
  /** Currently selected video */
  selectedVideo: VideoFile | null
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null

  /** Set the directory handle and scan for videos */
  setDirectory: (handle: FileSystemDirectoryHandle) => Promise<void>
  /** Clear the current directory */
  clearDirectory: () => void
  /** Select a video to play */
  selectVideo: (video: VideoFile | null) => void
  /** Refresh the video list */
  refresh: () => Promise<void>
}

export const useWatchStore = create<WatchStore>((set, get) => ({
  directoryHandle: null,
  directoryName: null,
  videos: [],
  selectedVideo: null,
  isLoading: false,
  error: null,

  setDirectory: async (handle) => {
    set({ directoryHandle: handle, directoryName: handle.name, isLoading: true, error: null })

    try {
      const videos = await scanDirectory(handle)
      set({ videos, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to scan directory',
        isLoading: false,
      })
    }
  },

  clearDirectory: () => {
    set({
      directoryHandle: null,
      directoryName: null,
      videos: [],
      selectedVideo: null,
      error: null,
    })
  },

  selectVideo: (video) => {
    set({ selectedVideo: video })
  },

  refresh: async () => {
    const { directoryHandle } = get()
    if (!directoryHandle) return

    set({ isLoading: true, error: null })
    try {
      const videos = await scanDirectory(directoryHandle)
      set({ videos, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to refresh directory',
        isLoading: false,
      })
    }
  },
}))

/** Scan directory for video files and match with subtitles */
async function scanDirectory(handle: FileSystemDirectoryHandle): Promise<VideoFile[]> {
  const videoMap = new Map<string, VideoFile>()
  const subtitleMap = new Map<string, { handle: FileSystemFileHandle; format: 'srt' | 'ass' | 'vtt' }>()

  // First pass: collect all files
  for await (const entry of handle.values()) {
    if (entry.kind !== 'file') continue

    const name = entry.name.toLowerCase()

    if (isVideoFile(name)) {
      const file = await entry.getFile()
      videoMap.set(getBaseName(entry.name), {
        name: entry.name,
        fileName: entry.name,
        handle: entry,
        size: file.size,
        lastModified: file.lastModified,
        hasSubtitle: false,
      })
    } else if (isSubtitleFile(name)) {
      const format = name.endsWith('.srt')
        ? 'srt'
        : name.endsWith('.ass')
          ? 'ass'
          : 'vtt'
      subtitleMap.set(getBaseName(entry.name), { handle: entry, format })
    }
  }

  // Second pass: match subtitles to videos
  for (const [baseName, video] of videoMap) {
    const subtitle = subtitleMap.get(baseName)
    if (subtitle) {
      video.hasSubtitle = true
      video.subtitleHandle = subtitle.handle
      video.subtitleFormat = subtitle.format
    }
  }

  // Sort by name
  return Array.from(videoMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
