/** Pitch accent pattern. */
export interface PitchPattern {
  kanji: string
  pattern: string
}

/** Word sense/meaning from dictionary. */
export interface Sense {
  glosses: string[]
  pos: string[]
  misc: string[]
}

/** Dictionary entry. */
export interface DictionaryEntry {
  id: number
  kanji: string[]
  readings: string[]
  senses: Sense[]
  pitch_accent: PitchPattern[]
}

/** Response from dictionary lookup API. */
export interface LookupResponse {
  query: string
  count: number
  entries: DictionaryEntry[]
}

/** Response from pitch accent lookup API. */
export interface PitchLookupResponse {
  reading: string
  count: number
  patterns: PitchPattern[]
}
