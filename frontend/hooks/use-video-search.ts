import { useState, useCallback } from 'react'
import { searchVideos } from '@/services/api'
import type { OnlineVideo } from '@/types/online-video'

export function useVideoSearch() {
  const [results, setResults] = useState<OnlineVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string, lang: string = 'ja') => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await searchVideos(query, lang, 20)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search videos')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    isLoading,
    error,
    search,
    clear,
  }
}
