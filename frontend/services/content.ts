import type {
  Content,
  ContentDetailResponse,
  ContentFilterParams,
  ContentImportRequest,
  ContentListResponse,
} from '@/types/content'

const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE = envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl

/** List all content with optional filters. */
export async function listContent(
  params: ContentFilterParams = {}
): Promise<ContentListResponse> {
  const searchParams = new URLSearchParams()

  if (params.source_type) searchParams.set('source_type', params.source_type)
  if (params.min_difficulty !== undefined)
    searchParams.set('min_difficulty', String(params.min_difficulty))
  if (params.max_difficulty !== undefined)
    searchParams.set('max_difficulty', String(params.max_difficulty))
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset))

  const url = `${API_BASE}/api/content?${searchParams.toString()}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to list content: ${res.status}`)
  }

  return res.json()
}

/** Get content detail with all chunks. */
export async function getContent(contentId: number): Promise<ContentDetailResponse> {
  const res = await fetch(`${API_BASE}/api/content/${contentId}`)

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Content not found')
    }
    throw new Error(`Failed to get content: ${res.status}`)
  }

  return res.json()
}

/** Import text content. */
export async function importTextContent(
  request: ContentImportRequest
): Promise<Content> {
  const res = await fetch(`${API_BASE}/api/content/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || `Failed to import content: ${res.status}`)
  }

  return res.json()
}

/** Import PDF content. */
export async function importPdfContent(
  file: File,
  title?: string,
  preTokenize = true
): Promise<Content> {
  const formData = new FormData()
  formData.append('file', file)
  if (title) formData.append('title', title)
  formData.append('pre_tokenize', String(preTokenize))

  const res = await fetch(`${API_BASE}/api/content/import/pdf`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || `Failed to import PDF: ${res.status}`)
  }

  return res.json()
}

/** Delete content and all its chunks. */
export async function deleteContent(contentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/content/${contentId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Content not found')
    }
    throw new Error(`Failed to delete content: ${res.status}`)
  }
}

/** Search content by title. */
export async function searchContent(
  query: string,
  limit = 20
): Promise<Content[]> {
  const res = await fetch(
    `${API_BASE}/api/content/search/${encodeURIComponent(query)}?limit=${limit}`
  )

  if (!res.ok) {
    throw new Error(`Failed to search content: ${res.status}`)
  }

  return res.json()
}
