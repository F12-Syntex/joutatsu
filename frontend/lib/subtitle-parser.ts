import type { SubtitleCue, ParsedSubtitles } from '@/types/subtitle'

/**
 * Parse an SRT subtitle file into structured data.
 *
 * SRT format:
 * 1
 * 00:00:01,000 --> 00:00:04,000
 * Subtitle text here
 * (blank line)
 */
export function parseSRT(content: string): ParsedSubtitles {
  const cues: SubtitleCue[] = []
  const lines = content.split(/\r?\n/)

  let i = 0
  while (i < lines.length) {
    // Skip empty lines
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }

    if (i >= lines.length) break

    // Parse index (optional, we generate our own)
    const indexLine = lines[i].trim()
    if (!/^\d+$/.test(indexLine)) {
      i++
      continue
    }
    i++

    if (i >= lines.length) break

    // Parse timing line
    const timingLine = lines[i].trim()
    const timingMatch = timingLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    )

    if (!timingMatch) {
      i++
      continue
    }

    const startTime = parseTimecode(
      timingMatch[1],
      timingMatch[2],
      timingMatch[3],
      timingMatch[4]
    )
    const endTime = parseTimecode(
      timingMatch[5],
      timingMatch[6],
      timingMatch[7],
      timingMatch[8]
    )

    i++

    // Parse text lines (until empty line or end)
    const textLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i])
      i++
    }

    if (textLines.length > 0) {
      cues.push({
        index: cues.length + 1,
        startTime,
        endTime,
        text: textLines.join('\n').trim(),
      })
    }
  }

  return {
    cues,
    format: 'srt',
  }
}

/**
 * Parse a VTT subtitle file into structured data.
 *
 * VTT format:
 * WEBVTT
 *
 * 00:00:01.000 --> 00:00:04.000
 * Subtitle text here
 */
export function parseVTT(content: string): ParsedSubtitles {
  const cues: SubtitleCue[] = []
  const lines = content.split(/\r?\n/)

  // Skip WEBVTT header
  let i = 0
  while (i < lines.length && !lines[i].includes('-->')) {
    i++
  }

  while (i < lines.length) {
    // Skip empty lines
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }

    if (i >= lines.length) break

    // Check if this is a timing line
    const timingLine = lines[i].trim()
    const timingMatch = timingLine.match(
      /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
    )

    // Also try format without hours
    const shortTimingMatch = timingLine.match(
      /(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2})\.(\d{3})/
    )

    if (timingMatch) {
      const startTime = parseTimecode(
        timingMatch[1],
        timingMatch[2],
        timingMatch[3],
        timingMatch[4]
      )
      const endTime = parseTimecode(
        timingMatch[5],
        timingMatch[6],
        timingMatch[7],
        timingMatch[8]
      )

      i++

      // Parse text lines
      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
        textLines.push(lines[i])
        i++
      }

      if (textLines.length > 0) {
        cues.push({
          index: cues.length + 1,
          startTime,
          endTime,
          text: textLines.join('\n').trim(),
        })
      }
    } else if (shortTimingMatch) {
      const startTime = parseTimecode(
        '00',
        shortTimingMatch[1],
        shortTimingMatch[2],
        shortTimingMatch[3]
      )
      const endTime = parseTimecode(
        '00',
        shortTimingMatch[4],
        shortTimingMatch[5],
        shortTimingMatch[6]
      )

      i++

      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
        textLines.push(lines[i])
        i++
      }

      if (textLines.length > 0) {
        cues.push({
          index: cues.length + 1,
          startTime,
          endTime,
          text: textLines.join('\n').trim(),
        })
      }
    } else {
      i++
    }
  }

  return {
    cues,
    format: 'vtt',
  }
}

/**
 * Parse an ASS/SSA subtitle file into structured data.
 * This is a simplified parser that extracts the dialogue lines.
 */
export function parseASS(content: string): ParsedSubtitles {
  const cues: SubtitleCue[] = []
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    // Match Dialogue lines
    // Format: Dialogue: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
    const match = line.match(
      /^Dialogue:\s*\d+,(\d+):(\d{2}):(\d{2})\.(\d{2}),(\d+):(\d{2}):(\d{2})\.(\d{2}),[^,]*,[^,]*,\d+,\d+,\d+,[^,]*,(.*)$/
    )

    if (match) {
      // ASS uses centiseconds, convert to milliseconds
      const startTime = parseTimecode(match[1], match[2], match[3], match[4] + '0')
      const endTime = parseTimecode(match[5], match[6], match[7], match[8] + '0')

      // Clean up ASS formatting codes
      let text = match[9]
      text = text.replace(/\{[^}]*\}/g, '') // Remove inline tags
      text = text.replace(/\\N/g, '\n') // Convert line breaks
      text = text.replace(/\\n/g, '\n')
      text = text.trim()

      if (text) {
        cues.push({
          index: cues.length + 1,
          startTime,
          endTime,
          text,
        })
      }
    }
  }

  // Sort by start time (ASS files may not be in order)
  cues.sort((a, b) => a.startTime - b.startTime)

  return {
    cues,
    format: 'ass',
  }
}

/**
 * Parse timecode components into milliseconds.
 */
function parseTimecode(
  hours: string,
  minutes: string,
  seconds: string,
  milliseconds: string
): number {
  return (
    parseInt(hours, 10) * 3600000 +
    parseInt(minutes, 10) * 60000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(milliseconds, 10)
  )
}

/**
 * Auto-detect format and parse subtitle file.
 */
export function parseSubtitles(
  content: string,
  format: 'srt' | 'ass' | 'vtt'
): ParsedSubtitles {
  switch (format) {
    case 'srt':
      return parseSRT(content)
    case 'vtt':
      return parseVTT(content)
    case 'ass':
      return parseASS(content)
    default:
      return parseSRT(content)
  }
}

/**
 * Find the current subtitle cue for a given time using binary search.
 */
export function findCurrentCue(
  cues: SubtitleCue[],
  timeMs: number
): SubtitleCue | null {
  if (cues.length === 0) return null

  // Binary search for efficiency
  let low = 0
  let high = cues.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const cue = cues[mid]

    if (timeMs >= cue.startTime && timeMs <= cue.endTime) {
      return cue
    } else if (timeMs < cue.startTime) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  return null
}

/**
 * Try to decode text with different encodings.
 * First try UTF-8, then Shift-JIS for Japanese content.
 */
export async function decodeSubtitleText(buffer: ArrayBuffer): Promise<string> {
  // Try UTF-8 first
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const text = decoder.decode(buffer)
    // Check if text looks valid (no replacement characters)
    if (!text.includes('\uFFFD')) {
      return text
    }
  } catch {
    // UTF-8 failed, try Shift-JIS
  }

  // Try Shift-JIS
  try {
    const decoder = new TextDecoder('shift-jis', { fatal: false })
    return decoder.decode(buffer)
  } catch {
    // Fallback to UTF-8 with replacement
    const decoder = new TextDecoder('utf-8', { fatal: false })
    return decoder.decode(buffer)
  }
}
