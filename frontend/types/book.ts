/** A book in the library */
export interface Book {
  id: string
  title: string
  author?: string
  coverUrl?: string
  sourceType: 'text' | 'pdf' | 'epub' | 'url'
  /** For local books: pages stored in memory */
  pages?: BookPage[]
  /** For backend books: content ID for fetching chunks */
  contentId?: number
  currentPage: number
  totalPages: number
  createdAt: number
  lastReadAt?: number
}

/** A single page of a book (local storage) */
export interface BookPage {
  pageNumber: number
  content: string
}

/** Book import request for local text */
export interface BookImportData {
  title: string
  author?: string
  content: string
  charsPerPage?: number
}
