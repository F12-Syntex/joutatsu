'use client'

import { useState, useCallback } from 'react'

import { tokenize as tokenizeApi, type TokenizeResponse } from '@/services/api'
import { useCanvasStore } from '@/stores/canvas-store'
import type { Token } from '@/types/token'

interface UseTokenizeOptions {
  mode?: 'A' | 'B' | 'C'
  onSuccess?: (tokens: Token[]) => void
  onError?: (error: Error) => void
}

interface UseTokenizeResult {
  tokenize: (text: string) => Promise<Token[]>
  isLoading: boolean
  error: Error | null
  data: TokenizeResponse | null
}

/** Hook for tokenizing Japanese text. */
export function useTokenize(options: UseTokenizeOptions = {}): UseTokenizeResult {
  const { mode = 'C', onSuccess, onError } = options
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TokenizeResponse | null>(null)

  const setTokens = useCanvasStore((s) => s.setTokens)
  const setLoading = useCanvasStore((s) => s.setLoading)

  const tokenize = useCallback(
    async (text: string): Promise<Token[]> => {
      if (!text.trim()) {
        setTokens([])
        return []
      }

      setIsLoading(true)
      setLoading(true)
      setError(null)

      try {
        const response = await tokenizeApi(text, mode)
        setData(response)

        // Map API response to Token type
        const tokens: Token[] = response.tokens.map((t) => ({
          surface: t.surface,
          dictionary_form: t.dictionary_form,
          reading: t.reading,
          pos: t.pos,
          pos_short: t.pos_short,
          start: t.start,
          end: t.end,
          is_known: t.is_known,
        }))

        setTokens(tokens)
        onSuccess?.(tokens)
        return tokens
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        setError(err)
        onError?.(err)
        return []
      } finally {
        setIsLoading(false)
        setLoading(false)
      }
    },
    [mode, setTokens, setLoading, onSuccess, onError]
  )

  return { tokenize, isLoading, error, data }
}
