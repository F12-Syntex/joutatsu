"use client";

import { useState, useEffect } from "react";
import {
  fetchDataStatus,
  lookupWord,
  lookupKanji,
  tokenizeText,
  analyzeText,
  type DataStatus,
  type DictionaryEntry,
  type KanjiEntry,
  type Token,
} from "@/services/api";

function StatusCard({
  title,
  status,
  children,
}: {
  title: string;
  status: "ready" | "loading" | "error";
  children: React.ReactNode;
}) {
  const statusColors = {
    ready: "bg-green-500",
    loading: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function SearchInput({
  placeholder,
  onSearch,
  loading,
}: {
  placeholder: string;
  onSearch: (query: string) => void;
  loading?: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "..." : "Search"}
      </button>
    </form>
  );
}

function DictionaryResult({ entries }: { entries: DictionaryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground">No entries found</p>;
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {entry.kanji.map((k) => (
              <span key={k} className="text-xl font-bold">
                {k}
              </span>
            ))}
            {entry.readings.map((r) => (
              <span key={r} className="text-lg text-muted-foreground">
                【{r}】
              </span>
            ))}
          </div>
          {entry.pitch.length > 0 && (
            <div className="text-xs text-blue-600 mb-2">
              Pitch: {entry.pitch.map((p) => `${p.kanji || "○"}[${p.pattern}]`).join(", ")}
            </div>
          )}
          <ol className="list-decimal list-inside space-y-1">
            {entry.senses.map((sense, i) => (
              <li key={i} className="text-sm">
                <span className="text-muted-foreground text-xs">
                  {sense.pos.join(", ")}
                </span>{" "}
                {sense.glosses.join("; ")}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function KanjiResult({ characters }: { characters: KanjiEntry[] }) {
  if (characters.length === 0) {
    return <p className="text-muted-foreground">No kanji found</p>;
  }

  return (
    <div className="space-y-4">
      {characters.map((char) => (
        <div key={char.literal} className="rounded-lg border p-4">
          <div className="flex gap-4">
            <span className="text-6xl font-bold">{char.literal}</span>
            <div className="flex-1">
              <div className="mb-2">
                <span className="text-sm font-medium">On: </span>
                <span className="text-sm">{char.readings.on.join("、") || "-"}</span>
              </div>
              <div className="mb-2">
                <span className="text-sm font-medium">Kun: </span>
                <span className="text-sm">{char.readings.kun.join("、") || "-"}</span>
              </div>
              <div className="text-sm">{char.meanings.join(", ")}</div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                {char.stroke_count && <span>Strokes: {char.stroke_count}</span>}
                {char.grade && <span>Grade: {char.grade}</span>}
                {char.jlpt && <span>JLPT: N{char.jlpt}</span>}
                {char.frequency && <span>Freq: #{char.frequency}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TokenResult({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) {
    return <p className="text-muted-foreground">No tokens</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Surface</th>
            <th className="text-left p-2">Dictionary</th>
            <th className="text-left p-2">Reading</th>
            <th className="text-left p-2">POS</th>
            <th className="text-left p-2">Pitch</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, i) => (
            <tr key={i} className="border-b hover:bg-muted/50">
              <td className="p-2 font-medium">{token.surface}</td>
              <td className="p-2">{token.dictionary_form}</td>
              <td className="p-2">{token.reading}</td>
              <td className="p-2 text-muted-foreground">{token.pos_short}</td>
              <td className="p-2 text-xs text-blue-600">
                {token.pitch.map((p) => p.pattern).join(", ") || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalysisResult({
  analysis,
}: {
  analysis: {
    surface: string;
    dictionary_form: string;
    reading: string;
    pos: string;
    dictionary: { kanji: string[]; kana: string[]; glosses: string[] }[];
    pitch: { kanji: string; pattern: string }[];
  }[];
}) {
  if (analysis.length === 0) {
    return <p className="text-muted-foreground">No analysis</p>;
  }

  return (
    <div className="space-y-2">
      {analysis.map((item, i) => (
        <div key={i} className="rounded border p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold">{item.surface}</span>
            <span className="text-muted-foreground">→</span>
            <span>{item.dictionary_form}</span>
            <span className="text-sm text-muted-foreground">【{item.reading}】</span>
            <span className="text-xs bg-muted px-1 rounded">{item.pos}</span>
          </div>
          {item.pitch.length > 0 && (
            <div className="text-xs text-blue-600 mb-1">
              Pitch: {item.pitch.map((p) => p.pattern).join(", ")}
            </div>
          )}
          {item.dictionary.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {item.dictionary[0]?.glosses.slice(0, 3).join("; ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DatabasePage() {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"dictionary" | "kanji" | "tokenize" | "analyze">(
    "dictionary"
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [dictResults, setDictResults] = useState<DictionaryEntry[]>([]);
  const [kanjiResults, setKanjiResults] = useState<KanjiEntry[]>([]);
  const [tokenResults, setTokenResults] = useState<Token[]>([]);
  const [analysisResults, setAnalysisResults] = useState<
    {
      surface: string;
      dictionary_form: string;
      reading: string;
      pos: string;
      dictionary: { kanji: string[]; kana: string[]; glosses: string[] }[];
      pitch: { kanji: string; pattern: string }[];
    }[]
  >([]);

  useEffect(() => {
    let completed = false;

    const loadStatus = async () => {
      try {
        console.log("[Database] Starting to fetch data status...");
        const data = await fetchDataStatus();
        console.log("[Database] Data received:", data);
        if (!completed) {
          completed = true;
          setStatus(data);
          setLoading(false);
        }
      } catch (e) {
        console.error("[Database] Failed to fetch data status:", e);
        if (!completed) {
          completed = true;
          const errorMsg = e instanceof Error ? e.message : "Unknown error";
          setError(`Failed to connect to backend: ${errorMsg}`);
          setLoading(false);
        }
      }
    };

    loadStatus();

    // Safety timeout - if still loading after 10 seconds, show error
    const safetyTimeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        console.error("[Database] Safety timeout triggered after 10 seconds");
        setError("Request timed out after 10 seconds. Is the backend running? (pnpm dev:backend)");
        setLoading(false);
      }
    }, 10000);

    return () => {
      completed = true;
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleDictSearch = async (query: string) => {
    setSearchLoading(true);
    try {
      const result = await lookupWord(query);
      setDictResults(result.entries);
    } catch {
      setDictResults([]);
    }
    setSearchLoading(false);
  };

  const handleKanjiSearch = async (query: string) => {
    setSearchLoading(true);
    try {
      const result = await lookupKanji(query);
      setKanjiResults(result.characters);
    } catch {
      setKanjiResults([]);
    }
    setSearchLoading(false);
  };

  const handleTokenize = async (text: string) => {
    setSearchLoading(true);
    try {
      const result = await tokenizeText(text);
      setTokenResults(result.tokens);
    } catch {
      setTokenResults([]);
    }
    setSearchLoading(false);
  };

  const handleAnalyze = async (text: string) => {
    setSearchLoading(true);
    try {
      const result = await analyzeText(text);
      setAnalysisResults(result.analysis);
    } catch {
      setAnalysisResults([]);
    }
    setSearchLoading(false);
  };

  if (loading) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="text-lg">Loading data status...</div>
          <div className="text-sm text-muted-foreground">
            Connecting to: {apiUrl}
          </div>
          <div className="text-xs text-muted-foreground">
            Make sure backend is running: pnpm dev:backend
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Explorer</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusCard
          title="JMdict"
          status={status?.jamdict.ready ? "ready" : status?.jamdict.installed ? "loading" : "error"}
        >
          <p>{status?.jamdict.entry_count.toLocaleString()} entries</p>
          <p>{status?.jamdict.kanji_count.toLocaleString()} kanji</p>
        </StatusCard>

        <StatusCard
          title="Sudachi"
          status={status?.sudachi.ready ? "ready" : status?.sudachi.installed ? "loading" : "error"}
        >
          <p>Dictionary: {status?.sudachi.dictionary || "none"}</p>
          <p>Tokenizer ready</p>
        </StatusCard>

        <StatusCard
          title="Pitch Accent"
          status={status?.pitch.ready ? "ready" : status?.pitch.file_exists ? "loading" : "error"}
        >
          <p>{status?.pitch.entry_count.toLocaleString()} readings</p>
        </StatusCard>
      </div>

      {/* Tabs */}
      <div className="border-b mb-4">
        <div className="flex gap-4">
          {(["dictionary", "kanji", "tokenize", "analyze"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "dictionary" && (
          <>
            <SearchInput
              placeholder="Search dictionary (English or Japanese)..."
              onSearch={handleDictSearch}
              loading={searchLoading}
            />
            <DictionaryResult entries={dictResults} />
          </>
        )}

        {activeTab === "kanji" && (
          <>
            <SearchInput
              placeholder="Enter a kanji character..."
              onSearch={handleKanjiSearch}
              loading={searchLoading}
            />
            <KanjiResult characters={kanjiResults} />
          </>
        )}

        {activeTab === "tokenize" && (
          <>
            <SearchInput
              placeholder="Enter Japanese text to tokenize..."
              onSearch={handleTokenize}
              loading={searchLoading}
            />
            <TokenResult tokens={tokenResults} />
          </>
        )}

        {activeTab === "analyze" && (
          <>
            <SearchInput
              placeholder="Enter Japanese text for full analysis..."
              onSearch={handleAnalyze}
              loading={searchLoading}
            />
            <AnalysisResult analysis={analysisResults} />
          </>
        )}
      </div>
    </div>
  );
}
