'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

import {
  startSession,
  endSession,
  updateSessionProgress,
  getActiveSession,
  recordLookup,
  recordRead,
  type ReadingSession,
  type ScoreUpdate,
} from '@/services/api'

interface UseReadingSessionOptions {
  contentId: number
  totalChunks: number
  onSessionStart?: (session: ReadingSession) => void
  onSessionEnd?: (session: ReadingSession) => void
  onScoreUpdate?: (updates: ScoreUpdate[]) => void
}

interface UseReadingSessionReturn {
  session: ReadingSession | null
  isLoading: boolean
  error: string | null
  currentChunk: number
  tokensRead: number
  lookupsCount: number
  lookedUpWords: Set<string>
  startReading: (chunkPosition?: number) => Promise<void>
  endReading: () => Promise<void>
  recordWordLookup: (dictionaryForm: string) => Promise<void>
  recordChunkRead: (dictionaryForms: string[]) => Promise<void>
  navigateToChunk: (chunkIndex: number) => Promise<void>
  addTokensRead: (count: number) => void
}

export function useReadingSession({
  contentId,
  totalChunks,
  onSessionStart,
  onSessionEnd,
  onScoreUpdate,
}: UseReadingSessionOptions): UseReadingSessionReturn {
  const [session, setSession] = useState<ReadingSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [tokensRead, setTokensRead] = useState(0)
  const [lookupsCount, setLookupsCount] = useState(0)
  const [lookedUpWords, setLookedUpWords] = useState<Set<string>>(new Set())

  // Use ref for tracked words to avoid stale closures
  const lookedUpWordsRef = useRef<Set<string>>(new Set())

  // Check for active session on mount
  useEffect(() => {
    let cancelled = false

    async function checkActiveSession() {
      try {
        const activeSession = await getActiveSession(contentId)
        if (cancelled) return

        if (activeSession) {
          setSession(activeSession)
          setCurrentChunk(activeSession.chunk_position)
          setTokensRead(activeSession.tokens_read)
          setLookupsCount(activeSession.lookups_count)
        }
      } catch {
        // No active session, that's fine
      }
    }

    checkActiveSession()
    return () => {
      cancelled = true
    }
  }, [contentId])

  const startReading = useCallback(
    async (chunkPosition = 0) => {
      setIsLoading(true)
      setError(null)

      try {
        const newSession = await startSession(contentId, chunkPosition)
        setSession(newSession)
        setCurrentChunk(chunkPosition)
        setTokensRead(0)
        setLookupsCount(0)
        setLookedUpWords(new Set())
        lookedUpWordsRef.current = new Set()
        onSessionStart?.(newSession)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to start session')
      } finally {
        setIsLoading(false)
      }
    },
    [contentId, onSessionStart]
  )

  const endReading = useCallback(async () => {
    if (!session) return

    setIsLoading(true)
    setError(null)

    try {
      const endedSession = await endSession(
        session.id,
        tokensRead,
        lookupsCount,
        currentChunk
      )
      setSession(null)
      onSessionEnd?.(endedSession)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to end session')
    } finally {
      setIsLoading(false)
    }
  }, [session, tokensRead, lookupsCount, currentChunk, onSessionEnd])

  const recordWordLookup = useCallback(
    async (dictionaryForm: string) => {
      // Track locally
      if (!lookedUpWordsRef.current.has(dictionaryForm)) {
        lookedUpWordsRef.current.add(dictionaryForm)
        setLookedUpWords(new Set(lookedUpWordsRef.current))
        setLookupsCount((prev) => prev + 1)
      }

      // Record to backend (fire and forget for UX)
      try {
        const update = await recordLookup(dictionaryForm)
        onScoreUpdate?.([update])
      } catch {
        // Silently fail - lookup is still tracked locally
      }
    },
    [onScoreUpdate]
  )

  const recordChunkRead = useCallback(
    async (dictionaryForms: string[]) => {
      if (dictionaryForms.length === 0) return

      // Record to backend with lookup info
      try {
        const updates = await recordRead(
          dictionaryForms,
          Array.from(lookedUpWordsRef.current)
        )
        onScoreUpdate?.(updates)

        // Clear looked up words for next chunk
        lookedUpWordsRef.current = new Set()
        setLookedUpWords(new Set())
      } catch {
        // Silently fail
      }
    },
    [onScoreUpdate]
  )

  const navigateToChunk = useCallback(
    async (chunkIndex: number) => {
      if (chunkIndex < 0 || chunkIndex >= totalChunks) return

      setCurrentChunk(chunkIndex)

      // Update session progress if we have an active session
      if (session) {
        try {
          await updateSessionProgress(
            session.id,
            tokensRead,
            lookupsCount,
            chunkIndex
          )
        } catch {
          // Silently fail - navigation should still work
        }
      }
    },
    [session, tokensRead, lookupsCount, totalChunks]
  )

  const addTokensRead = useCallback((count: number) => {
    setTokensRead((prev) => prev + count)
  }, [])

  return {
    session,
    isLoading,
    error,
    currentChunk,
    tokensRead,
    lookupsCount,
    lookedUpWords,
    startReading,
    endReading,
    recordWordLookup,
    recordChunkRead,
    navigateToChunk,
    addTokensRead,
  }
}
