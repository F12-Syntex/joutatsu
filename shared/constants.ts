// Shared constants between frontend and backend

export const API_VERSION = "v1";
export const DEFAULT_API_URL = "http://localhost:8000/api";

// Scoring thresholds
export const KNOWN_SCORE_THRESHOLD = 0.8;
export const LEARNING_SCORE_THRESHOLD = 0.4;

// Anki integration
export const ANKI_CONNECT_DEFAULT_PORT = 8765;
export const ANKI_MATURE_INTERVAL_DAYS = 21;

// Content chunking
export const MAX_TOKENS_PER_CHUNK = 500;
export const SENTENCE_TERMINATORS = ["。", "！", "？", "!", "?"];

// TTS
export const DEFAULT_TTS_VOICE = "ja-JP-NanamiNeural";
export const DEFAULT_TTS_SPEED = 1.0;
