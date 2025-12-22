/** A single subtitle cue with timing */
export interface SubtitleCue {
  /** Cue index (1-based for SRT) */
  index: number
  /** Start time in milliseconds */
  startTime: number
  /** End time in milliseconds */
  endTime: number
  /** Subtitle text content (may contain multiple lines) */
  text: string
}

/** Parsed subtitle file */
export interface ParsedSubtitles {
  /** List of subtitle cues sorted by start time */
  cues: SubtitleCue[]
  /** Original format */
  format: 'srt' | 'ass' | 'vtt'
}
