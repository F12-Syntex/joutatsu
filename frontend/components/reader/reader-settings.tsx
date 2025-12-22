'use client'

import { useState, useEffect } from 'react'
import {
  Settings2,
  Download,
  Minus,
  Plus,
  Search,
  AlignLeft,
  AlignVerticalJustifyStart,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useReaderStore, type PosColors } from '@/stores/reader-store'

const popularJapaneseFonts = [
  { name: 'Noto Sans JP', weight: '400;500;700' },
  { name: 'Noto Serif JP', weight: '400;500;700' },
  { name: 'M PLUS Rounded 1c', weight: '400;500;700' },
  { name: 'M PLUS 1p', weight: '400;500;700' },
  { name: 'Kosugi Maru', weight: '400' },
  { name: 'Sawarabi Gothic', weight: '400' },
  { name: 'Sawarabi Mincho', weight: '400' },
  { name: 'Zen Maru Gothic', weight: '400;500;700' },
  { name: 'Zen Kaku Gothic New', weight: '400;500;700' },
  { name: 'Shippori Mincho', weight: '400;500;700' },
  { name: 'Klee One', weight: '400;600' },
  { name: 'Yomogi', weight: '400' },
]

const posLabels: { key: keyof PosColors; label: string; example: string }[] = [
  { key: 'verb', label: 'Verbs', example: '食べる' },
  { key: 'noun', label: 'Nouns', example: '猫' },
  { key: 'adjective', label: 'Adjectives', example: '美しい' },
  { key: 'adverb', label: 'Adverbs', example: 'とても' },
  { key: 'particle', label: 'Particles', example: 'が' },
]

export function ReaderSettings() {
  const {
    settings,
    installedFonts,
    updateSettings,
    updatePosColor,
    addFont,
  } = useReaderStore()

  const [fontSearch, setFontSearch] = useState('')
  const [loadingFont, setLoadingFont] = useState<string | null>(null)
  const [showFontSearch, setShowFontSearch] = useState(false)

  const loadGoogleFont = async (fontName: string) => {
    const fontConfig = popularJapaneseFonts.find((f) => f.name === fontName)
    if (!fontConfig) return

    setLoadingFont(fontName)

    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(
      / /g,
      '+'
    )}:wght@${fontConfig.weight}&display=swap`

    const existingLink = document.querySelector(`link[href="${fontUrl}"]`)
    if (!existingLink) {
      const link = document.createElement('link')
      link.href = fontUrl
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    addFont(fontName)
    setLoadingFont(null)
    setShowFontSearch(false)
    setFontSearch('')
  }

  useEffect(() => {
    installedFonts.forEach((font) => {
      const fontConfig = popularJapaneseFonts.find((f) => f.name === font)
      if (fontConfig) {
        const fontUrl = `https://fonts.googleapis.com/css2?family=${font.replace(
          / /g,
          '+'
        )}:wght@${fontConfig.weight}&display=swap`
        const existingLink = document.querySelector(`link[href="${fontUrl}"]`)
        if (!existingLink) {
          const link = document.createElement('link')
          link.href = fontUrl
          link.rel = 'stylesheet'
          document.head.appendChild(link)
        }
      }
    })
  }, [installedFonts])

  const filteredFonts = popularJapaneseFonts.filter(
    (f) =>
      f.name.toLowerCase().includes(fontSearch.toLowerCase()) &&
      !installedFonts.includes(f.name)
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/30">
          <h2 className="text-sm font-medium">Settings</h2>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Font Size */}
          <div className="px-4 py-3 border-b border-border/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Font Size</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    updateSettings({ fontSize: Math.max(14, settings.fontSize - 2) })
                  }
                  className="h-7 w-7 rounded-md bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-10 text-center text-sm font-medium tabular-nums">
                  {settings.fontSize}
                </span>
                <button
                  onClick={() =>
                    updateSettings({ fontSize: Math.min(64, settings.fontSize + 2) })
                  }
                  className="h-7 w-7 rounded-md bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Line Height */}
          <div className="px-4 py-3 border-b border-border/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Line Height</span>
              <div className="flex rounded-lg bg-secondary/40 p-0.5">
                {[1.5, 2.0, 2.5, 3.0].map((height) => (
                  <button
                    key={height}
                    onClick={() => updateSettings({ lineHeight: height })}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                      settings.lineHeight === height
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {height.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Writing Mode */}
          <div className="px-4 py-3 border-b border-border/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reading Mode</span>
              <div className="flex rounded-lg bg-secondary/40 p-0.5">
                <button
                  onClick={() => updateSettings({ writingMode: 'horizontal-tb' })}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
                    settings.writingMode === 'horizontal-tb'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Horizontal (left to right)"
                >
                  <AlignLeft className="h-3 w-3" />
                  横書き
                </button>
                <button
                  onClick={() => updateSettings({ writingMode: 'vertical-rl' })}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
                    settings.writingMode === 'vertical-rl'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Vertical (top to bottom, right to left)"
                >
                  <AlignVerticalJustifyStart className="h-3 w-3" />
                  縦書き
                </button>
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div className="px-4 py-3 border-b border-border/20">
            <span className="text-sm text-muted-foreground block mb-2">Font</span>
            <div className="flex flex-wrap gap-1.5">
              {installedFonts.map((font) => (
                <button
                  key={font}
                  onClick={() => updateSettings({ fontFamily: font })}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs transition-all',
                    settings.fontFamily === font
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                  style={{ fontFamily: font }}
                >
                  {font.replace(' JP', '').replace(' 1c', '')}
                </button>
              ))}
              {!showFontSearch && (
                <button
                  onClick={() => setShowFontSearch(true)}
                  className="px-2 py-1 rounded-md text-xs border border-dashed border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  +
                </button>
              )}
            </div>
            {showFontSearch && (
              <div className="mt-2 space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    className="pl-7 h-7 text-xs bg-secondary/30 border-border/50"
                    autoFocus
                  />
                </div>
                <div className="max-h-28 overflow-y-auto rounded-md bg-secondary/20">
                  {filteredFonts.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      {fontSearch ? 'Not found' : 'All added'}
                    </p>
                  ) : (
                    filteredFonts.slice(0, 4).map((font) => (
                      <button
                        key={font.name}
                        onClick={() => loadGoogleFont(font.name)}
                        disabled={loadingFont === font.name}
                        className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-secondary/50 transition-colors text-xs"
                      >
                        <span>{font.name}</span>
                        {loadingFont === font.name ? (
                          <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        ) : (
                          <Download className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowFontSearch(false)
                    setFontSearch('')
                  }}
                  className="w-full py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="px-4 py-3 border-b border-border/20 space-y-2">
            <ToggleRow
              label="Furigana"
              checked={settings.showFurigana}
              onChange={(v) => updateSettings({ showFurigana: v })}
            />
            <ToggleRow
              label="Word meanings"
              checked={settings.showMeanings}
              onChange={(v) => updateSettings({ showMeanings: v })}
            />
            <ToggleRow
              label="Color by word type"
              checked={settings.colorByPos}
              onChange={(v) => updateSettings({ colorByPos: v })}
            />
          </div>

          {/* POS Colors */}
          {settings.colorByPos && (
            <div className="px-4 py-3 border-b border-border/20">
              <span className="text-xs text-muted-foreground block mb-2">
                Word Colors
              </span>
              <div className="flex justify-between">
                {posLabels.map(({ key, label, example }) => (
                  <div key={key} className="text-center">
                    <div className="relative mx-auto mb-1">
                      <input
                        type="color"
                        value={
                          settings.posColors[key] === 'inherit'
                            ? '#888888'
                            : settings.posColors[key]
                        }
                        onChange={(e) => updatePosColor(key, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div
                        className="h-7 w-7 mx-auto rounded-full border-2 border-background shadow-sm transition-transform hover:scale-110"
                        style={{
                          backgroundColor:
                            settings.posColors[key] === 'inherit'
                              ? '#888888'
                              : settings.posColors[key],
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium block"
                      style={{
                        color:
                          settings.posColors[key] === 'inherit'
                            ? undefined
                            : settings.posColors[key],
                      }}
                    >
                      {example}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="px-4 py-3">
            <div
              className={cn(
                'p-3 rounded-lg bg-card/80 border border-border/30',
                settings.writingMode === 'vertical-rl' && 'h-24'
              )}
              style={{
                fontSize: Math.min(settings.fontSize, 18),
                lineHeight: settings.lineHeight,
                fontFamily: settings.fontFamily,
                writingMode: settings.writingMode,
              }}
            >
              {settings.colorByPos ? (
                <p>
                  <span style={{ color: settings.posColors.noun }}>猫</span>
                  <span style={{ color: settings.posColors.particle }}>が</span>
                  <span style={{ color: settings.posColors.adverb }}>静かに</span>
                  <span style={{ color: settings.posColors.verb }}>歩く</span>
                  。
                </p>
              ) : (
                <p>猫が静かに歩く。</p>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between"
    >
      <span className="text-sm">{label}</span>
      <div
        className={cn(
          'h-5 w-9 rounded-full transition-colors relative',
          checked ? 'bg-primary' : 'bg-secondary'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
    </button>
  )
}
