'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  BookOpen,
  MoreHorizontal,
  Trash2,
  Clock,
  FileText,
  FileType,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLibraryStore } from '@/stores/library-store'
import { BookImportDialog } from '@/components/library/book-import-dialog'
import type { Book } from '@/types/book'

export default function LibraryPage() {
  const { books, removeBook } = useLibraryStore()
  const [importOpen, setImportOpen] = useState(false)

  const sortedBooks = [...books].sort((a, b) => {
    if (a.lastReadAt && b.lastReadAt) return b.lastReadAt - a.lastReadAt
    if (a.lastReadAt) return -1
    if (b.lastReadAt) return 1
    return b.createdAt - a.createdAt
  })

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold">Library</h1>
              <p className="text-sm text-muted-foreground">
                {books.length} {books.length === 1 ? 'book' : 'books'}
              </p>
            </div>
            <Button onClick={() => setImportOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Import
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {books.length === 0 ? (
            <EmptyState onImport={() => setImportOpen(true)} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={() => removeBook(book.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Import Dialog */}
        <BookImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </div>
    </MainLayout>
  )
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-1">No books yet</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Import your first book to start reading
      </p>
      <Button onClick={onImport} className="gap-2">
        <Plus className="h-4 w-4" />
        Import Book
      </Button>
    </div>
  )
}

// Generate a consistent gradient based on title
function getTitleGradient(title: string | undefined): string {
  const safeTitle = title || 'Untitled'
  let hash = 0
  for (let i = 0; i < safeTitle.length; i++) {
    hash = safeTitle.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue1 = Math.abs(hash % 360)
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 60%, 25%) 0%, hsl(${hue2}, 50%, 15%) 100%)`
}

function BookCard({ book, onDelete }: { book: Book; onDelete: () => void }) {
  const progress = Math.round((book.currentPage / book.totalPages) * 100)
  const lastRead = book.lastReadAt
    ? formatRelativeTime(book.lastReadAt)
    : null

  const SourceIcon = book.sourceType === 'pdf' ? FileType : FileText

  return (
    <div className="group relative">
      <Link href={`/library/${book.id}`}>
        <div className="relative aspect-[3/4] rounded-xl border border-border/50 overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          {/* Cover or generated placeholder */}
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-4"
              style={{ background: getTitleGradient(book.title) }}
            >
              {/* Source type icon */}
              <SourceIcon className="h-8 w-8 text-white/20 mb-3" />
              {/* Title preview */}
              <span
                className="text-2xl font-bold text-white/80 text-center leading-tight line-clamp-3"
                style={{ fontFamily: 'serif' }}
              >
                {book.title || 'Untitled'}
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{book.title || 'Untitled'}</h3>
            {book.author && (
              <p className="text-xs text-muted-foreground truncate">
                {book.author}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-6 w-6 rounded-md hover:bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress info */}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>
            {book.currentPage}/{book.totalPages}
          </span>
          <span>·</span>
          <span>{progress}%</span>
          {lastRead && (
            <>
              <span>·</span>
              <Clock className="h-3 w-3" />
              <span>{lastRead}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
