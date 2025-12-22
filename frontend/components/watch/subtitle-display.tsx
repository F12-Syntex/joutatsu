'use client'

import { useState, useEffect, useMemo } from 'react'

import { cn } from '@/lib/utils'
import { JapaneseText } from '@/components/japanese-text/japanese-text'
import type { ParsedSubtitles } from '@/types/subtitle'
import { parseSubtitles, findCurrentCue, decodeSubtitleText } from '@/lib/subtitle-parser'

interface SubtitleDisplayProps {
  subtitleHandle: FileSystemFileHandle
  currentTime: number // in seconds
}

export function SubtitleDisplay({ subtitleHandle, currentTime }: SubtitleDisplayProps) {
  const [subtitles, setSubtitles] = useState<ParsedSubtitles | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load and parse subtitle file
  useEffect(() => {
    async function loadSubtitles() {
      try {
        const file = await subtitleHandle.getFile()
        const buffer = await file.arrayBuffer()
        const text = await decodeSubtitleText(buffer)

        // Determine format from filename
        const name = file.name.toLowerCase()
        const format = name.endsWith('.srt')
          ? 'srt'
          : name.endsWith('.ass')
            ? 'ass'
            : 'vtt'

        const parsed = parseSubtitles(text, format)
        setSubtitles(parsed)
        setError(null)
      } catch (err) {
        console.error('Failed to load subtitles:', err)
        setError('Failed to load subtitles')
      }
    }

    loadSubtitles()
  }, [subtitleHandle])

  // Find current cue based on video time
  const currentCue = useMemo(() => {
    if (!subtitles) return null
    const timeMs = currentTime * 1000
    return findCurrentCue(subtitles.cues, timeMs)
  }, [subtitles, currentTime])

  if (error) {
    return (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 rounded text-red-400 text-sm">
        {error}
      </div>
    )
  }

  if (!currentCue) {
    return null
  }

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[80%]">
      <div
        className={cn(
          'px-4 py-3 bg-black/80 rounded-lg',
          'text-white text-center',
          'shadow-lg'
        )}
      >
        <JapaneseText
          text={currentCue.text}
          fontSize={24}
          lineHeight={1.6}
          showFurigana={true}
          showMeanings={false}
          colorByPos={false}
          className="justify-center"
        />
      </div>
    </div>
  )
}
