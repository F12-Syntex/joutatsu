import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PosColors {
  verb: string
  noun: string
  adjective: string
  adverb: string
  particle: string
  default: string
}

export type WritingMode = 'horizontal-tb' | 'vertical-rl'

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  fontFamily: string
  showFurigana: boolean
  colorByPos: boolean
  posColors: PosColors
  writingMode: WritingMode
}

interface ReaderStore {
  settings: ReaderSettings
  installedFonts: string[]
  updateSettings: (updates: Partial<ReaderSettings>) => void
  updatePosColor: (pos: keyof PosColors, color: string) => void
  addFont: (font: string) => void
  removeFont: (font: string) => void
}

const defaultPosColors: PosColors = {
  verb: '#3b82f6',      // blue
  noun: '#f59e0b',      // amber
  adjective: '#10b981', // emerald
  adverb: '#8b5cf6',    // violet
  particle: '#71717a',  // gray
  default: 'inherit',
}

const defaultSettings: ReaderSettings = {
  fontSize: 24,
  lineHeight: 2.2,
  fontFamily: 'Noto Sans JP',
  showFurigana: true,
  colorByPos: false,
  posColors: defaultPosColors,
  writingMode: 'horizontal-tb',
}

const defaultFonts = [
  'Noto Sans JP',
  'Noto Serif JP',
  'M PLUS Rounded 1c',
  'Kosugi Maru',
  'Sawarabi Gothic',
  'Sawarabi Mincho',
]

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      installedFonts: defaultFonts,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      updatePosColor: (pos, color) =>
        set((state) => ({
          settings: {
            ...state.settings,
            posColors: { ...state.settings.posColors, [pos]: color },
          },
        })),
      addFont: (font) =>
        set((state) => ({
          installedFonts: state.installedFonts.includes(font)
            ? state.installedFonts
            : [...state.installedFonts, font],
        })),
      removeFont: (font) =>
        set((state) => ({
          installedFonts: state.installedFonts.filter((f) => f !== font),
        })),
    }),
    {
      name: 'reader-settings',
    }
  )
)

/** Map Japanese POS tags to color keys */
export function getPosColorKey(posShort: string): keyof PosColors {
  if (posShort.includes('動詞') || posShort.includes('助動詞')) return 'verb'
  if (posShort.includes('名詞') || posShort.includes('代名詞')) return 'noun'
  if (posShort.includes('形容詞') || posShort.includes('形状詞')) return 'adjective'
  if (posShort.includes('副詞')) return 'adverb'
  if (posShort.includes('助詞')) return 'particle'
  return 'default'
}
