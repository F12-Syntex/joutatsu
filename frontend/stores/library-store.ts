import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Book, BookPage, BookImportData } from '@/types/book'
import type { ContentResponse } from '@/services/api'

interface LibraryStore {
  books: Book[]
  addBook: (data: BookImportData) => Book
  addBackendBook: (content: ContentResponse) => Book
  removeBook: (id: string) => void
  updateProgress: (id: string, page: number) => void
  getBook: (id: string) => Book | undefined
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function splitIntoPages(content: string, charsPerPage: number = 800): BookPage[] {
  const pages: BookPage[] = []
  const paragraphs = content.split(/\n+/).filter((p) => p.trim())

  let currentPage = ''
  let pageNumber = 1

  for (const paragraph of paragraphs) {
    if (currentPage.length + paragraph.length > charsPerPage && currentPage.length > 0) {
      pages.push({ pageNumber, content: currentPage.trim() })
      pageNumber++
      currentPage = paragraph + '\n\n'
    } else {
      currentPage += paragraph + '\n\n'
    }
  }

  if (currentPage.trim()) {
    pages.push({ pageNumber, content: currentPage.trim() })
  }

  return pages.length > 0 ? pages : [{ pageNumber: 1, content: content }]
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      books: [],

      addBook: (data) => {
        const pages = splitIntoPages(data.content, data.charsPerPage)
        const book: Book = {
          id: generateId(),
          title: data.title,
          author: data.author,
          sourceType: 'text',
          pages,
          currentPage: 1,
          totalPages: pages.length,
          createdAt: Date.now(),
        }

        set((state) => ({
          books: [book, ...state.books],
        }))

        return book
      },

      addBackendBook: (content) => {
        const book: Book = {
          id: generateId(),
          title: content.title,
          sourceType: content.source_type,
          contentId: content.id,
          currentPage: 1,
          totalPages: content.chunk_count,
          createdAt: Date.now(),
        }

        set((state) => ({
          books: [book, ...state.books],
        }))

        return book
      },

      removeBook: (id) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
        }))
      },

      updateProgress: (id, page) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id
              ? { ...b, currentPage: page, lastReadAt: Date.now() }
              : b
          ),
        }))
      },

      getBook: (id) => {
        return get().books.find((b) => b.id === id)
      },
    }),
    {
      name: 'library',
    }
  )
)
