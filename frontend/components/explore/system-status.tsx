'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Database, BookOpen, Languages } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchDataStatus, type DataStatus } from '@/services/api'

export function SystemStatus() {
  const [status, setStatus] = useState<DataStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await fetchDataStatus()
        setStatus(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load status')
      } finally {
        setIsLoading(false)
      }
    }
    loadStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) return null

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* JMdict Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">JMdict Dictionary</CardTitle>
            </div>
            <StatusBadge ready={status.jamdict.ready} />
          </div>
          <CardDescription>Japanese-English dictionary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusRow label="Installed" value={status.jamdict.installed} />
          <StatusRow label="Database exists" value={status.jamdict.database_exists} />
          <DataRow label="Entries" value={status.jamdict.entry_count.toLocaleString()} />
          <DataRow label="Kanji" value={status.jamdict.kanji_count.toLocaleString()} />
        </CardContent>
      </Card>

      {/* Sudachi Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">SudachiPy Tokenizer</CardTitle>
            </div>
            <StatusBadge ready={status.sudachi.ready} />
          </div>
          <CardDescription>Japanese morphological analyzer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusRow label="Installed" value={status.sudachi.installed} />
          <DataRow label="Dictionary" value={status.sudachi.dictionary || 'N/A'} />
        </CardContent>
      </Card>

      {/* Pitch Accent Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Kanjium Pitch Accent</CardTitle>
            </div>
            <StatusBadge ready={status.pitch.ready} />
          </div>
          <CardDescription>Pitch accent patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusRow label="File exists" value={status.pitch.file_exists} />
          <DataRow label="Entries" value={status.pitch.entry_count.toLocaleString()} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Ready
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Not Ready
    </Badge>
  )
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
