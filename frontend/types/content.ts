/** Content source type. */
export type ContentType = 'TEXT' | 'PDF' | 'URL' | 'EPUB'

/** Content item from the API. */
export interface Content {
  id: number
  title: string
  source_type: ContentType
  file_path: string | null
  original_url: string | null
  created_at: string
  difficulty_estimate: number | null
  total_tokens: number
  unique_vocabulary: number
  chunk_count: number
}

/** Content list response. */
export interface ContentListResponse {
  items: Content[]
  total: number
  limit: number
  offset: number
}

/** Content chunk from the API. */
export interface ContentChunk {
  id: number
  content_id: number
  chunk_index: number
  raw_text: string
  tokenized_json: string | null
  page_number: number | null
}

/** Content detail response with chunks. */
export interface ContentDetailResponse {
  content: Content
  chunks: ContentChunk[]
}

/** Request to import text content. */
export interface ContentImportRequest {
  title: string
  text: string
  source_type?: ContentType
  chunk_size?: number
  pre_tokenize?: boolean
}

/** Filter parameters for listing content. */
export interface ContentFilterParams {
  source_type?: ContentType
  min_difficulty?: number
  max_difficulty?: number
  limit?: number
  offset?: number
}
