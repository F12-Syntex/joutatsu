// Remove trailing /api if present since we add it in the fetch calls
const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = envUrl.endsWith("/api") ? envUrl.slice(0, -4) : envUrl;

export interface DataStatus {
  jamdict: {
    installed: boolean;
    database_exists: boolean;
    entry_count: number;
    kanji_count: number;
    ready: boolean;
  };
  sudachi: {
    installed: boolean;
    dictionary: string | null;
    ready: boolean;
  };
  pitch: {
    file_exists: boolean;
    entry_count: number;
    ready: boolean;
  };
}

export interface DictionaryEntry {
  id: number;
  kanji: string[];
  readings: string[];
  senses: { glosses: string[]; pos: string[] }[];
  pitch: { kanji: string; pattern: string }[];
}

export interface KanjiEntry {
  literal: string;
  readings: { on: string[]; kun: string[] };
  meanings: string[];
  stroke_count: number;
  grade: number | null;
  jlpt: number | null;
  frequency: number | null;
}

export interface Token {
  surface: string;
  dictionary_form: string;
  reading: string;
  pos: string[];
  pos_short: string;
  start: number;
  end: number;
  pitch: { kanji: string; pattern: string }[];
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e instanceof Error ? e : new Error(String(e));

      if (attempt < maxRetries) {
        console.log(`[API] Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  if (lastError?.name === "AbortError") {
    throw new Error(`Request timed out - backend at ${url} not responding`);
  }
  if (lastError instanceof TypeError) {
    throw new Error(`Cannot connect to ${url} - is the backend running? (pnpm dev:backend)`);
  }
  throw lastError;
}

export async function fetchDataStatus(): Promise<DataStatus> {
  const url = `${API_BASE}/api/data/status`;
  console.log("[API] Fetching data status from:", url);

  const res = await fetchWithRetry(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  console.log("[API] Data status received:", data);
  return data;
}

export async function lookupWord(
  query: string,
  limit = 10
): Promise<{ query: string; count: number; entries: DictionaryEntry[] }> {
  const res = await fetch(
    `${API_BASE}/api/data/dictionary/lookup?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) throw new Error("Failed to lookup word");
  return res.json();
}

export async function lookupKanji(
  query: string
): Promise<{ query: string; count: number; characters: KanjiEntry[] }> {
  const res = await fetch(
    `${API_BASE}/api/data/dictionary/kanji?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Failed to lookup kanji");
  return res.json();
}

export async function tokenizeText(
  text: string,
  mode = "C"
): Promise<{ text: string; token_count: number; tokens: Token[] }> {
  const res = await fetch(
    `${API_BASE}/api/data/tokenize?text=${encodeURIComponent(text)}&mode=${mode}`
  );
  if (!res.ok) throw new Error("Failed to tokenize");
  return res.json();
}

export async function analyzeText(
  text: string
): Promise<{
  text: string;
  token_count: number;
  analysis: {
    surface: string;
    dictionary_form: string;
    reading: string;
    pos: string;
    dictionary: { kanji: string[]; kana: string[]; glosses: string[] }[];
    pitch: { kanji: string; pattern: string }[];
  }[];
}> {
  const res = await fetch(
    `${API_BASE}/api/data/tokenize/analyze?text=${encodeURIComponent(text)}`
  );
  if (!res.ok) throw new Error("Failed to analyze");
  return res.json();
}

// New API endpoints for main tokenize and dictionary services

export interface TokenizeToken {
  surface: string;
  dictionary_form: string;
  reading: string;
  pos: string[];
  pos_short: string;
  start: number;
  end: number;
  is_known: boolean;
}

export interface TokenizeResponse {
  text: string;
  mode: string;
  token_count: number;
  tokens: TokenizeToken[];
}

export interface PitchPattern {
  kanji: string;
  pattern: string;
}

export interface Sense {
  glosses: string[];
  pos: string[];
  misc: string[];
}

export interface DictEntry {
  id: number;
  kanji: string[];
  readings: string[];
  senses: Sense[];
  pitch_accent: PitchPattern[];
}

export interface DictLookupResponse {
  query: string;
  count: number;
  entries: DictEntry[];
}

export interface PitchLookupResponse {
  reading: string;
  count: number;
  patterns: PitchPattern[];
}

/** Tokenize text using the main tokenize API. */
export async function tokenize(
  text: string,
  mode: "A" | "B" | "C" = "C"
): Promise<TokenizeResponse> {
  const res = await fetch(`${API_BASE}/api/tokenize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode }),
  });
  if (!res.ok) throw new Error("Failed to tokenize");
  return res.json();
}

/** Look up a word in the dictionary. */
export async function dictionaryLookup(
  query: string,
  limit = 10
): Promise<DictLookupResponse> {
  const res = await fetch(
    `${API_BASE}/api/dictionary/lookup?query=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) throw new Error("Failed to lookup dictionary");
  return res.json();
}

/** Look up pitch accent for a reading. */
export async function pitchLookup(reading: string): Promise<PitchLookupResponse> {
  const res = await fetch(
    `${API_BASE}/api/dictionary/pitch/${encodeURIComponent(reading)}`
  );
  if (!res.ok) throw new Error("Failed to lookup pitch");
  return res.json();
}

// Content API types and functions

export interface ContentImage {
  id: number;
  content_id: number;
  chunk_index?: number;
  image_index: number;
  page_number?: number;
  extension: string;
  width: number;
  height: number;
}

export interface ContentChunk {
  id: number;
  content_id: number;
  chunk_index: number;
  raw_text: string;
  tokenized_json?: string;
  page_number?: number;
  images: ContentImage[];
}

export interface ContentResponse {
  id: number;
  title: string;
  source_type: "text" | "pdf" | "epub" | "url";
  cover_image_id?: number;
  difficulty?: number;
  chunk_count: number;
  image_count?: number;
  total_tokens?: number;
  unique_vocab?: number;
  created_at: string;
  chunks?: ContentChunk[];
}

export interface ContentListResponse {
  contents: ContentResponse[];
  total: number;
}

/** Import a PDF file and extract text. */
export async function importPDF(
  file: File,
  title?: string,
  preTokenize = false
): Promise<ContentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) {
    formData.append("title", title);
  }
  formData.append("pre_tokenize", String(preTokenize));

  const res = await fetch(`${API_BASE}/api/content/import/pdf`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to import PDF" }));
    throw new Error(error.detail || "Failed to import PDF");
  }

  return res.json();
}

/** Import text content. */
export async function importText(
  text: string,
  title: string,
  preTokenize = false
): Promise<ContentResponse> {
  const res = await fetch(`${API_BASE}/api/content/import/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, title, pre_tokenize: preTokenize }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to import text" }));
    throw new Error(error.detail || "Failed to import text");
  }

  return res.json();
}

/** Get content by ID with chunks. */
export async function getContent(id: number): Promise<ContentResponse> {
  const res = await fetch(`${API_BASE}/api/content/${id}`);
  if (!res.ok) throw new Error("Failed to get content");
  return res.json();
}

/** Get a specific chunk of content. */
export async function getContentChunk(
  contentId: number,
  chunkIndex: number
): Promise<ContentChunk> {
  const res = await fetch(`${API_BASE}/api/content/${contentId}/chunk/${chunkIndex}`);
  if (!res.ok) throw new Error("Failed to get chunk");
  return res.json();
}

/** List all content. */
export async function listContent(
  sourceType?: string,
  limit = 50,
  offset = 0
): Promise<ContentListResponse> {
  const params = new URLSearchParams();
  if (sourceType) params.append("source_type", sourceType);
  params.append("limit", String(limit));
  params.append("offset", String(offset));

  const res = await fetch(`${API_BASE}/api/content?${params}`);
  if (!res.ok) throw new Error("Failed to list content");
  return res.json();
}

/** Delete content by ID. */
export async function deleteContent(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/content/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete content");
}

/** Get the URL for a content image. */
export function getImageUrl(imageId: number): string {
  return `${API_BASE}/api/content/image/${imageId}`;
}

/** Get all images for a content item. */
export async function getContentImages(contentId: number): Promise<ContentImage[]> {
  const res = await fetch(`${API_BASE}/api/content/${contentId}/images`);
  if (!res.ok) throw new Error("Failed to get images");
  return res.json();
}

// ==================== Progress API ====================

export interface ScoreUpdate {
  vocabulary_id: number;
  old_score: number;
  new_score: number;
  times_seen: number;
  times_looked_up: number;
  consecutive_correct: number;
}

export interface VocabularyScore {
  vocabulary_id: number;
  dictionary_form: string;
  surface: string;
  reading: string;
  score: number;
  times_seen: number;
  times_looked_up: number;
  consecutive_correct: number;
  last_seen: string;
}

export interface ProgressSummary {
  total_vocabulary: number;
  known_words: number;
  learning_words: number;
  average_score: number;
  mastery_percentage: number;
  total_lookups: number;
  total_words_seen: number;
}

export interface WeakVocabularyResponse {
  items: VocabularyScore[];
  total: number;
}

/** Get overall progress summary. */
export async function getProgressSummary(): Promise<ProgressSummary> {
  const res = await fetch(`${API_BASE}/api/progress/summary`);
  if (!res.ok) throw new Error("Failed to get progress summary");
  return res.json();
}

/** Get vocabulary items with lowest scores. */
export async function getWeakestVocabulary(limit = 20): Promise<WeakVocabularyResponse> {
  const res = await fetch(`${API_BASE}/api/progress/weakest?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to get weakest vocabulary");
  return res.json();
}

/** Record that a word was looked up. */
export async function recordLookup(dictionaryForm: string): Promise<ScoreUpdate> {
  const res = await fetch(`${API_BASE}/api/progress/record-lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dictionary_form: dictionaryForm }),
  });
  if (!res.ok) throw new Error("Failed to record lookup");
  return res.json();
}

/** Record words read, some with lookups. */
export async function recordRead(
  dictionaryForms: string[],
  lookedUpForms: string[] = []
): Promise<ScoreUpdate[]> {
  const res = await fetch(`${API_BASE}/api/progress/record-read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dictionary_forms: dictionaryForms,
      looked_up_forms: lookedUpForms,
    }),
  });
  if (!res.ok) throw new Error("Failed to record read");
  return res.json();
}

/** Get overall mastery score. */
export async function getOverallScore(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/progress/score`);
  if (!res.ok) throw new Error("Failed to get overall score");
  return res.json();
}

// ==================== Session API ====================

export interface ReadingSession {
  id: number;
  content_id: number;
  started_at: string;
  ended_at: string | null;
  tokens_read: number;
  lookups_count: number;
  chunk_position: number;
}

export interface SessionWithContent {
  id: number;
  content_id: number;
  content_title: string;
  started_at: string;
  ended_at: string | null;
  tokens_read: number;
  lookups_count: number;
  chunk_position: number;
}

export interface SessionStats {
  total_sessions: number;
  completed_sessions: number;
  total_tokens_read: number;
  total_lookups: number;
}

export interface SessionHistory {
  sessions: SessionWithContent[];
  total: number;
}

/** Start a new reading session. */
export async function startSession(
  contentId: number,
  chunkPosition = 0
): Promise<ReadingSession> {
  const res = await fetch(`${API_BASE}/api/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content_id: contentId,
      chunk_position: chunkPosition,
    }),
  });
  if (!res.ok) throw new Error("Failed to start session");
  return res.json();
}

/** End a reading session. */
export async function endSession(
  sessionId: number,
  tokensRead: number,
  lookupsCount: number,
  chunkPosition: number
): Promise<ReadingSession> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokens_read: tokensRead,
      lookups_count: lookupsCount,
      chunk_position: chunkPosition,
    }),
  });
  if (!res.ok) throw new Error("Failed to end session");
  return res.json();
}

/** Update session progress without ending it. */
export async function updateSessionProgress(
  sessionId: number,
  tokensRead: number,
  lookupsCount: number,
  chunkPosition: number
): Promise<ReadingSession> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokens_read: tokensRead,
      lookups_count: lookupsCount,
      chunk_position: chunkPosition,
    }),
  });
  if (!res.ok) throw new Error("Failed to update progress");
  return res.json();
}

/** Get active session for content (for resuming). */
export async function getActiveSession(contentId: number): Promise<ReadingSession | null> {
  const res = await fetch(`${API_BASE}/api/sessions/content/${contentId}/active`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to get active session");
  return res.json();
}

/** Get session history. */
export async function getSessionHistory(limit = 20): Promise<SessionHistory> {
  const res = await fetch(`${API_BASE}/api/sessions/history?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to get session history");
  return res.json();
}

/** Get session statistics. */
export async function getSessionStats(): Promise<SessionStats> {
  const res = await fetch(`${API_BASE}/api/sessions/stats`);
  if (!res.ok) throw new Error("Failed to get session stats");
  return res.json();
}

// ==================== Proficiency API ====================

export interface ProficiencyStats {
  level: string;
  total_characters_read: number;
  total_tokens_read: number;
  total_lookups: number;
  total_reading_time_minutes: number;
  lookup_rate: number;
  reading_speed: number;
  easy_ratings: number;
  just_right_ratings: number;
  hard_ratings: number;
}

export interface ReaderRecommendations {
  show_furigana: "all" | "unknown" | "none";
  show_meanings: boolean;
  furigana_threshold: number;
  highlight_unknown: boolean;
  suggested_level: string;
}

export interface DifficultyRatingRecord {
  id: number;
  content_id: number;
  rating: "easy" | "just_right" | "hard";
  feedback: string | null;
  chunk_position: number | null;
  rated_at: string;
}

/** Get user proficiency statistics. */
export async function getProficiencyStats(): Promise<ProficiencyStats> {
  const res = await fetch(`${API_BASE}/api/proficiency/stats`);
  if (!res.ok) throw new Error("Failed to get proficiency stats");
  return res.json();
}

/** Get recommended reader settings based on proficiency. */
export async function getReaderRecommendations(): Promise<ReaderRecommendations> {
  const res = await fetch(`${API_BASE}/api/proficiency/recommendations`);
  if (!res.ok) throw new Error("Failed to get recommendations");
  return res.json();
}

/** Record metrics from a reading session. */
export async function recordReadingSession(
  charactersRead: number,
  tokensRead: number,
  lookups: number,
  readingTimeSeconds: number
): Promise<ProficiencyStats> {
  const res = await fetch(`${API_BASE}/api/proficiency/record-reading`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      characters_read: charactersRead,
      tokens_read: tokensRead,
      lookups,
      reading_time_seconds: readingTimeSeconds,
    }),
  });
  if (!res.ok) throw new Error("Failed to record reading");
  return res.json();
}

/** Record difficulty rating for content. */
export async function recordDifficultyRating(
  contentId: number,
  rating: "easy" | "just_right" | "hard",
  feedback?: string,
  chunkPosition?: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/proficiency/record-difficulty`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content_id: contentId,
      rating,
      feedback,
      chunk_position: chunkPosition,
    }),
  });
  if (!res.ok) throw new Error("Failed to record difficulty");
}

/** Get difficulty ratings. */
export async function getDifficultyRatings(
  contentId?: number,
  limit = 50
): Promise<DifficultyRatingRecord[]> {
  const params = new URLSearchParams();
  if (contentId !== undefined) params.append("content_id", String(contentId));
  params.append("limit", String(limit));

  const res = await fetch(`${API_BASE}/api/proficiency/difficulty-ratings?${params}`);
  if (!res.ok) throw new Error("Failed to get difficulty ratings");
  return res.json();
}

/** Update auto-adjustment thresholds. */
export async function updateProficiencyThresholds(
  furiganaThreshold?: number,
  meaningsThreshold?: number
): Promise<ProficiencyStats> {
  const res = await fetch(`${API_BASE}/api/proficiency/thresholds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      furigana_threshold: furiganaThreshold,
      meanings_threshold: meaningsThreshold,
    }),
  });
  if (!res.ok) throw new Error("Failed to update thresholds");
  return res.json();
}
