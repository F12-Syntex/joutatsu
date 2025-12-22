'use client'

import { useCallback, useState } from 'react'
import { FolderOpen, Video, RefreshCw, ArrowLeft, Globe } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWatchStore } from '@/stores/watch-store'
import { VideoList } from '@/components/watch/video-list'
import { VideoPlayer } from '@/components/watch/video-player'
import { VideoSearchBar } from '@/components/watch/video-search-bar'
import { OnlineVideoGrid } from '@/components/watch/online-video-grid'
import { DownloadQueue } from '@/components/watch/download-queue'
import { useVideoSearch } from '@/hooks/use-video-search'
import { useDownloads } from '@/hooks/use-downloads'
import type { OnlineVideo } from '@/types/online-video'

export default function WatchPage() {
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local')
  const {
    directoryHandle,
    directoryName,
    videos,
    selectedVideo,
    isLoading,
    error,
    setDirectory,
    clearDirectory,
    selectVideo,
    refresh,
  } = useWatchStore()

  const {
    results: searchResults,
    isLoading: isSearching,
    error: searchError,
    search,
  } = useVideoSearch()

  const {
    downloads,
    isLoading: isDownloading,
    startDownload,
    removeDownload,
  } = useDownloads()

  const handleSelectDirectory = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'read',
      })
      await setDirectory(handle)
    } catch (err) {
      // User cancelled or error
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to open directory:', err)
      }
    }
  }, [setDirectory])

  const handleDownloadVideo = useCallback(
    async (video: OnlineVideo) => {
      await startDownload({
        video_id: video.video_id,
        title: video.title,
        thumbnail_url: video.thumbnail || '',
      })
    },
    [startDownload]
  )

  const handlePlayDownload = useCallback(
    (download: any) => {
      // Refresh local videos to pick up the downloaded file
      refresh()
      // Switch to local tab
      setActiveTab('local')
    },
    [refresh]
  )

  // If a video is selected, show the player
  if (selectedVideo) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
            <div className="flex items-center gap-4 px-6 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectVideo(null)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-medium truncate">{selectedVideo.name}</h1>
                {selectedVideo.hasSubtitle && (
                  <p className="text-xs text-muted-foreground">
                    Subtitles: {selectedVideo.subtitleFormat?.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* Player */}
          <div className="flex-1">
            <VideoPlayer video={selectedVideo} />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold">Watch</h1>
              {activeTab === 'local' ? (
                directoryName ? (
                  <p className="text-sm text-muted-foreground">
                    {videos.length} {videos.length === 1 ? 'video' : 'videos'} in {directoryName}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a folder to browse videos
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Browse and download Japanese videos
                </p>
              )}
            </div>
            {activeTab === 'local' && (
              <div className="flex items-center gap-2">
                {directoryHandle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refresh}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
                <Button onClick={handleSelectDirectory} className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {directoryHandle ? 'Change Folder' : 'Select Folder'}
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'local' | 'online')}>
            <TabsList className="mb-6">
              <TabsTrigger value="local" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Local Files
              </TabsTrigger>
              <TabsTrigger value="online" className="gap-2">
                <Globe className="h-4 w-4" />
                Browse Online
              </TabsTrigger>
            </TabsList>

            <TabsContent value="local" className="mt-0">
              {error && (
                <div className="p-4 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {!directoryHandle ? (
                <EmptyState onSelect={handleSelectDirectory} />
              ) : isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : videos.length === 0 ? (
                <NoVideosState onChangeFolder={handleSelectDirectory} onClear={clearDirectory} />
              ) : (
                <VideoList videos={videos} onSelect={selectVideo} />
              )}
            </TabsContent>

            <TabsContent value="online" className="mt-0">
              <div className="space-y-6">
                {searchError && (
                  <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {searchError}
                  </div>
                )}

                <VideoSearchBar onSearch={search} isLoading={isSearching} />
                <OnlineVideoGrid
                  videos={searchResults}
                  onDownload={handleDownloadVideo}
                  downloadingIds={downloads
                    .filter((d) => d.status === 'pending' || d.status === 'downloading')
                    .map((d) => d.video_id)}
                  isLoading={isSearching}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Download Queue */}
        <DownloadQueue
          downloads={downloads}
          onDelete={removeDownload}
          onPlay={handlePlayDownload}
        />
      </div>
    </MainLayout>
  )
}

function EmptyState({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
        <Video className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-1">No folder selected</h2>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
        Select a folder containing video files with Japanese subtitles to start watching
      </p>
      <Button onClick={onSelect} className="gap-2">
        <FolderOpen className="h-4 w-4" />
        Select Folder
      </Button>
    </div>
  )
}

function NoVideosState({
  onChangeFolder,
  onClear,
}: {
  onChangeFolder: () => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
        <Video className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-1">No videos found</h2>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
        The selected folder doesn&apos;t contain any supported video files (.mp4, .mkv, .webm)
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
        <Button onClick={onChangeFolder} className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Choose Different Folder
        </Button>
      </div>
    </div>
  )
}
