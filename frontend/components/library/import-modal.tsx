'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { importTextContent, importPdfContent } from '@/services/content'
import type { Content } from '@/types/content'

type ImportMode = 'text' | 'pdf'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (content: Content) => void
}

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [mode, setMode] = useState<ImportMode>('text')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = useCallback(() => {
    setTitle('')
    setText('')
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      resetForm()
      onOpenChange(false)
    }
  }, [isLoading, resetForm, onOpenChange])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a PDF file')
        return
      }
      setFile(selectedFile)
      setError(null)
      // Auto-fill title from filename if empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.pdf$/i, ''))
      }
    }
  }, [title])

  const handleSubmit = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      let content: Content

      if (mode === 'text') {
        if (!title.trim()) {
          throw new Error('Title is required')
        }
        if (!text.trim()) {
          throw new Error('Text content is required')
        }
        content = await importTextContent({
          title: title.trim(),
          text: text.trim(),
          pre_tokenize: true,
        })
      } else {
        if (!file) {
          throw new Error('Please select a PDF file')
        }
        content = await importPdfContent(file, title.trim() || undefined, true)
      }

      resetForm()
      onOpenChange(false)
      onSuccess?.(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }, [mode, title, text, file, resetForm, onOpenChange, onSuccess])

  const canSubmit = mode === 'text'
    ? title.trim() && text.trim() && !isLoading
    : file && !isLoading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Import Content</DialogTitle>
          <DialogDescription>
            Add new reading material to your library
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('text')}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Text
          </Button>
          <Button
            variant={mode === 'pdf' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('pdf')}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for this content"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {mode === 'text' ? (
            <div className="grid gap-2">
              <Label htmlFor="text">Japanese Text</Label>
              <Textarea
                id="text"
                placeholder="Paste Japanese text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px]"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="file">PDF File</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
