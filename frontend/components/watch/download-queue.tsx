'use client'

import { ChevronDown, ChevronUp, Download as DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DownloadItem } from './download-item'
import { useDownloadStore } from '@/stores/download-store'
import type { Download } from '@/types/online-video'

interface DownloadQueueProps {
  downloads: Download[]
  onDelete: (id: number) => void
  onPlay?: (download: Download) => void
}

export function DownloadQueue({
  downloads,
  onDelete,
  onPlay,
}: DownloadQueueProps) {
  const { isQueueOpen, toggleQueue } = useDownloadStore()

  if (downloads.length === 0) {
    return null
  }

  const activeDownloads = downloads.filter(
    (d) => d.status === 'pending' || d.status === 'downloading'
  ).length

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg">
      <CardHeader className="cursor-pointer p-3" onClick={toggleQueue}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DownloadIcon className="h-4 w-4" />
            Downloads ({downloads.length})
            {activeDownloads > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {activeDownloads} active
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm">
            {isQueueOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isQueueOpen && (
        <CardContent className="max-h-96 space-y-2 overflow-y-auto p-3 pt-0">
          {downloads.map((download) => (
            <DownloadItem
              key={download.id}
              download={download}
              onDelete={onDelete}
              onPlay={onPlay}
            />
          ))}
        </CardContent>
      )}
    </Card>
  )
}
