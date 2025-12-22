'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  getProficiencyStats,
  getReaderRecommendations,
  recordDifficultyRating,
  recordReadingSession,
  type ProficiencyStats,
  type ReaderRecommendations,
} from '@/services/api'

interface UseProficiencyReturn {
  stats: ProficiencyStats | null
  recommendations: ReaderRecommendations | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  recordReading: (
    charactersRead: number,
    tokensRead: number,
    lookups: number,
    readingTimeSeconds: number
  ) => Promise<void>
  recordDifficulty: (
    contentId: number,
    rating: 'easy' | 'just_right' | 'hard',
    feedback?: string,
    chunkPosition?: number
  ) => Promise<void>
}

export function useProficiency(): UseProficiencyReturn {
  const [stats, setStats] = useState<ProficiencyStats | null>(null)
  const [recommendations, setRecommendations] = useState<ReaderRecommendations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [statsData, recsData] = await Promise.all([
        getProficiencyStats(),
        getReaderRecommendations(),
      ])
      setStats(statsData)
      setRecommendations(recsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proficiency')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const recordReading = useCallback(
    async (
      charactersRead: number,
      tokensRead: number,
      lookups: number,
      readingTimeSeconds: number
    ) => {
      try {
        const updatedStats = await recordReadingSession(
          charactersRead,
          tokensRead,
          lookups,
          readingTimeSeconds
        )
        setStats(updatedStats)
        // Refresh recommendations since level may have changed
        const recsData = await getReaderRecommendations()
        setRecommendations(recsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record reading')
      }
    },
    []
  )

  const recordDifficulty = useCallback(
    async (
      contentId: number,
      rating: 'easy' | 'just_right' | 'hard',
      feedback?: string,
      chunkPosition?: number
    ) => {
      try {
        await recordDifficultyRating(contentId, rating, feedback, chunkPosition)
        // Refresh stats after recording
        const statsData = await getProficiencyStats()
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record difficulty')
      }
    },
    []
  )

  return {
    stats,
    recommendations,
    isLoading,
    error,
    refresh: fetchData,
    recordReading,
    recordDifficulty,
  }
}
