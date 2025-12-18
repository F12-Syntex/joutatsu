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
