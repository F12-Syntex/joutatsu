'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  getProgressSummary,
  getWeakestVocabulary,
  getSessionHistory,
  getSessionStats,
  type ProgressSummary,
  type VocabularyScore,
  type SessionWithContent,
  type SessionStats,
} from '@/services/api'

interface UseProgressReturn {
  summary: ProgressSummary | null
  weakestWords: VocabularyScore[]
  sessionHistory: SessionWithContent[]
  sessionStats: SessionStats | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProgress(): UseProgressReturn {
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [weakestWords, setWeakestWords] = useState<VocabularyScore[]>([])
  const [sessionHistory, setSessionHistory] = useState<SessionWithContent[]>([])
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [summaryData, weakestData, historyData, statsData] =
        await Promise.all([
          getProgressSummary(),
          getWeakestVocabulary(20),
          getSessionHistory(10),
          getSessionStats(),
        ])

      setSummary(summaryData)
      setWeakestWords(weakestData.items)
      setSessionHistory(historyData.sessions)
      setSessionStats(statsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load progress')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    summary,
    weakestWords,
    sessionHistory,
    sessionStats,
    isLoading,
    error,
    refresh: fetchData,
  }
}
