/** Token data from the tokenizer API. */
export interface Token {
  /** Surface form as it appears in text. */
  surface: string
  /** Dictionary/base form. */
  dictionary_form: string
  /** Reading in katakana. */
  reading: string
  /** Full part of speech tags. */
  pos: string[]
  /** Short part of speech (first tag). */
  pos_short: string
  /** Start position in original text. */
  start: number
  /** End position in original text. */
  end: number
  /** Whether the user knows this word. */
  is_known: boolean
}

/** Response from tokenize API. */
export interface TokenizeResponse {
  text: string
  mode: string
  token_count: number
  tokens: Token[]
}

/** Request for tokenize API. */
export interface TokenizeRequest {
  text: string
  mode?: 'A' | 'B' | 'C'
}
