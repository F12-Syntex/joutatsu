'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { useLibraryStore } from '@/stores/library-store'
import { importPDF } from '@/services/api'

interface BookImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookImportDialog({ open, onOpenChange }: BookImportDialogProps) {
  const router = useRouter()
  const { addBook, addBackendBook } = useLibraryStore()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setTitle('')
    setAuthor('')
    setContent('')
    setFileName('')
    setPdfFile(null)
    setError(null)
  }, [])

  const handleImport = useCallback(async () => {
    const finalTitle = title.trim() || fileName || 'Untitled'

    // Handle PDF upload to backend
    if (pdfFile) {
      setIsLoading(true)
      setError(null)
      try {
        const contentResponse = await importPDF(pdfFile, finalTitle, true)
        const book = addBackendBook(contentResponse)
        reset()
        onOpenChange(false)
        router.push(`/library/${book.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import PDF')
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Handle text content
    if (!content.trim()) return

    const book = addBook({
      title: finalTitle,
      author: author.trim() || undefined,
      content: content.trim(),
      charsPerPage: 600,
    })

    reset()
    onOpenChange(false)
    router.push(`/library/${book.id}`)
  }, [title, author, content, fileName, pdfFile, addBook, addBackendBook, reset, onOpenChange, router])

  const processFile = useCallback(async (file: File) => {
    const name = file.name.replace(/\.(txt|pdf)$/i, '')
    setFileName(name)
    setError(null)

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text()
      setContent(text)
      setPdfFile(null)
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setPdfFile(file)
      setContent('')
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const charCount = content.length
  const estimatedPages = Math.ceil(charCount / 600)

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent showClose={false} className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Import Book</ModalTitle>
        </ModalHeader>

        <ModalBody>
          {/* Error display */}
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Content first - most important */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Content</label>
                {charCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {charCount.toLocaleString()} chars · ~{estimatedPages} pages
                  </span>
                )}
                {pdfFile && (
                  <span className="text-xs text-muted-foreground">
                    PDF · {(pdfFile.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>

              {content ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[160px] text-sm resize-none"
                  placeholder="Paste Japanese text here..."
                />
              ) : pdfFile ? (
                <div className="min-h-[160px] rounded-xl border border-border bg-muted/30 flex flex-col items-center justify-center gap-2 p-6">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{pdfFile.name}</p>
                  <p className="text-xs text-muted-foreground">Ready to import</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPdfFile(null)
                      setFileName('')
                    }}
                    className="mt-1 h-7 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <DropZone
                  isDragging={isDragging}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onFileSelect={handleFileSelect}
                />
              )}
            </div>

            {/* Title & Author - optional, shown after content or PDF */}
            {(content || pdfFile) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Title <span className="opacity-50">(optional)</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={fileName || 'Untitled'}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Author <span className="opacity-50">(optional)</span>
                  </label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Unknown"
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={(!content.trim() && !pdfFile) || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface DropZoneProps {
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function DropZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: DropZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'relative min-h-[160px] rounded-xl border-2 border-dashed transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border/50 hover:border-border'
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6">
        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Drop file or{' '}
          <span className="text-primary cursor-pointer hover:underline">
            browse
          </span>
        </p>
        <p className="text-xs text-muted-foreground/60">.txt or .pdf</p>
      </div>
      <input
        type="file"
        accept=".txt,.pdf,text/plain,application/pdf"
        onChange={onFileSelect}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  )
}
