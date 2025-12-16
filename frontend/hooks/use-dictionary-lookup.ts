'use client'

import { useState, useCallback, useRef } from 'react'

import { dictionaryLookup as lookupApi, type DictEntry } from '@/services/api'
import type { DictionaryEntry } from '@/types/dictionary'

interface UseDictionaryLookupOptions {
  limit?: number
  debounceMs?: number
  onSuccess?: (entries: DictionaryEntry[]) => void
  onError?: (error: Error) => void
}

interface UseDictionaryLookupResult {
  lookup: (query: string) => Promise<DictionaryEntry[]>
  isLoading: boolean
  error: Error | null
  entries: DictionaryEntry[]
  query: string
}

/** Hook for looking up words in the dictionary. */
export function useDictionaryLookup(
  options: UseDictionaryLookupOptions = {}
): UseDictionaryLookupResult {
  const { limit = 10, debounceMs = 150, onSuccess, onError } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [entries, setEntries] = useState<DictionaryEntry[]>([])
  const [query, setQuery] = useState('')

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const lookup = useCallback(
    async (newQuery: string): Promise<DictionaryEntry[]> => {
      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Abort previous request
      if (abortRef.current) {
        abortRef.current.abort()
      }

      if (!newQuery.trim()) {
        setEntries([])
        setQuery('')
        return []
      }

      setQuery(newQuery)

      return new Promise((resolve) => {
        debounceRef.current = setTimeout(async () => {
          setIsLoading(true)
          setError(null)
          abortRef.current = new AbortController()

          try {
            const response = await lookupApi(newQuery, limit)

            // Map API response to DictionaryEntry type
            const mappedEntries: DictionaryEntry[] = response.entries.map(
              (e: DictEntry) => ({
                id: e.id,
                kanji: e.kanji,
                readings: e.readings,
                senses: e.senses.map((s) => ({
                  glosses: s.glosses,
                  pos: s.pos,
                  misc: s.misc || [],
                })),
                pitch_accent: e.pitch_accent.map((p) => ({
                  kanji: p.kanji,
                  pattern: p.pattern,
                })),
              })
            )

            setEntries(mappedEntries)
            onSuccess?.(mappedEntries)
            resolve(mappedEntries)
          } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
              resolve([])
              return
            }
            const err = e instanceof Error ? e : new Error(String(e))
            setError(err)
            setEntries([])
            onError?.(err)
            resolve([])
          } finally {
            setIsLoading(false)
          }
        }, debounceMs)
      })
    },
    [limit, debounceMs, onSuccess, onError]
  )

  return { lookup, isLoading, error, entries, query }
}
