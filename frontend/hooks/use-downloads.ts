import { useState, useEffect, useCallback } from 'react'
import { listDownloads, queueDownload, deleteDownload } from '@/services/api'
import type { Download, DownloadQueueRequest } from '@/types/online-video'

export function useDownloads() {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await listDownloads()
      setDownloads(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch downloads')
    }
  }, [])

  const startDownload = useCallback(async (request: DownloadQueueRequest) => {
    setIsLoading(true)
    try {
      await queueDownload(request)
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start download')
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  const removeDownload = useCallback(async (downloadId: number) => {
    setIsLoading(true)
    try {
      await deleteDownload(downloadId)
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete download')
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  // Auto-refresh every 2 seconds when there are active downloads
  useEffect(() => {
    const hasActiveDownloads = downloads.some(
      (d) => d.status === 'pending' || d.status === 'downloading'
    )

    if (hasActiveDownloads) {
      const interval = setInterval(refresh, 2000)
      return () => clearInterval(interval)
    }
  }, [downloads, refresh])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    downloads,
    isLoading,
    error,
    refresh,
    startDownload,
    removeDownload,
  }
}
