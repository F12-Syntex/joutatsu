'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { VideoFile } from '@/types/video'
import { SubtitleDisplay } from './subtitle-display'

interface VideoPlayerProps {
  video: VideoFile
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Define callbacks first before effects that use them
  const togglePlayPause = useCallback(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (videoEl.paused) {
      videoEl.play()
    } else {
      videoEl.pause()
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await container.requestFullscreen()
    }
  }, [])

  const handleSeek = useCallback((value: number[]) => {
    const videoEl = videoRef.current
    if (videoEl) {
      videoEl.currentTime = value[0]
    }
  }, [])

  const skip = useCallback((seconds: number) => {
    const videoEl = videoRef.current
    if (videoEl && isFinite(videoEl.duration)) {
      videoEl.currentTime = Math.max(0, Math.min(videoEl.duration, videoEl.currentTime + seconds))
    }
  }, [])

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  // Load video file
  useEffect(() => {
    let url: string | null = null

    async function loadVideo() {
      try {
        const file = await video.handle.getFile()
        url = URL.createObjectURL(file)
        setVideoUrl(url)
      } catch (err) {
        console.error('Failed to load video:', err)
      }
    }

    loadVideo()

    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [video.handle])

  // Video event handlers
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const handleTimeUpdate = () => setCurrentTime(videoEl.currentTime)
    const handleDurationChange = () => setDuration(videoEl.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    videoEl.addEventListener('timeupdate', handleTimeUpdate)
    videoEl.addEventListener('durationchange', handleDurationChange)
    videoEl.addEventListener('play', handlePlay)
    videoEl.addEventListener('pause', handlePause)

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate)
      videoEl.removeEventListener('durationchange', handleDurationChange)
      videoEl.removeEventListener('play', handlePlay)
      videoEl.removeEventListener('pause', handlePause)
    }
  }, [videoUrl])

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const videoEl = videoRef.current
      if (!videoEl) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(5)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume((v) => Math.min(1, v + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume((v) => Math.max(0, v - 0.1))
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          setIsMuted((m) => !m)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayPause, toggleFullscreen, skip])

  // Apply volume changes
  useEffect(() => {
    const videoEl = videoRef.current
    if (videoEl) {
      videoEl.volume = volume
      videoEl.muted = isMuted
    }
  }, [volume, isMuted])

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading video...</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black h-full flex items-center justify-center"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="max-w-full max-h-full"
        onClick={togglePlayPause}
      />

      {/* Subtitles */}
      {video.hasSubtitle && video.subtitleHandle && (
        <SubtitleDisplay
          subtitleHandle={video.subtitleHandle}
          currentTime={currentTime}
        />
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Gradient background */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* Controls */}
        <div className="relative px-4 pb-4 space-y-2">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80 min-w-[45px]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-white/80 min-w-[45px] text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-10)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(10)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted((m) => !m)}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v: number[]) => {
                    setVolume(v[0])
                    setIsMuted(false)
                  }}
                  className="w-24"
                />
              </div>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
