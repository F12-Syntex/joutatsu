import { create } from 'zustand'

import type { Token } from '@/types/token'

/** Canvas settings for font and display. */
export interface CanvasSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  showFurigana: boolean
  highlightUnknown: boolean
}

/** Content being displayed. */
export interface Content {
  id: number
  title: string
  text: string
}

/** Canvas state and actions. */
interface CanvasState {
  // State
  currentContent: Content | null
  currentChunk: number
  tokens: Token[]
  hoveredToken: Token | null
  selectedToken: Token | null
  settings: CanvasSettings
  isLoading: boolean

  // Actions
  setContent: (content: Content | null) => void
  setChunk: (index: number) => void
  setTokens: (tokens: Token[]) => void
  setHoveredToken: (token: Token | null) => void
  selectToken: (token: Token | null) => void
  updateSettings: (settings: Partial<CanvasSettings>) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const defaultSettings: CanvasSettings = {
  fontSize: 24,
  fontFamily: 'Noto Sans JP, sans-serif',
  lineHeight: 2,
  showFurigana: true,
  highlightUnknown: true,
}

const initialState = {
  currentContent: null,
  currentChunk: 0,
  tokens: [],
  hoveredToken: null,
  selectedToken: null,
  settings: defaultSettings,
  isLoading: false,
}

export const useCanvasStore = create<CanvasState>((set) => ({
  ...initialState,

  setContent: (content) => set({ currentContent: content, currentChunk: 0 }),
  setChunk: (index) => set({ currentChunk: index }),
  setTokens: (tokens) => set({ tokens }),
  setHoveredToken: (token) => set({ hoveredToken: token }),
  selectToken: (token) => set({ selectedToken: token }),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set(initialState),
}))
