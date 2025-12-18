'use client'

import { useState, useEffect } from 'react'
import {
  Settings2,
  Plus,
  Minus,
  Check,
  X,
  Download,
  Palette,
  Type,
  Eye,
  EyeOff,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReaderStore, type PosColors } from '@/stores/reader-store'

const popularJapaneseFonts = [
  { name: 'Noto Sans JP', weight: '400;500;700' },
  { name: 'Noto Serif JP', weight: '400;500;700' },
  { name: 'M PLUS Rounded 1c', weight: '400;500;700' },
  { name: 'M PLUS 1p', weight: '400;500;700' },
  { name: 'Kosugi Maru', weight: '400' },
  { name: 'Kosugi', weight: '400' },
  { name: 'Sawarabi Gothic', weight: '400' },
  { name: 'Sawarabi Mincho', weight: '400' },
  { name: 'Zen Maru Gothic', weight: '400;500;700' },
  { name: 'Zen Kaku Gothic New', weight: '400;500;700' },
  { name: 'Shippori Mincho', weight: '400;500;700' },
  { name: 'Klee One', weight: '400;600' },
  { name: 'Yomogi', weight: '400' },
  { name: 'Hachi Maru Pop', weight: '400' },
  { name: 'Dela Gothic One', weight: '400' },
]

const posColorLabels: Record<keyof PosColors, string> = {
  verb: 'Verbs',
  noun: 'Nouns',
  adjective: 'Adjectives',
  adverb: 'Adverbs',
  particle: 'Particles',
  default: 'Other',
}

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

  // Load Google Font dynamically
  const loadGoogleFont = async (fontName: string) => {
    const fontConfig = popularJapaneseFonts.find((f) => f.name === fontName)
    if (!fontConfig) return

    setLoadingFont(fontName)

    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(
      / /g,
      '+'
    )}:wght@${fontConfig.weight}&display=swap`

    // Check if already loaded
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`)
    if (!existingLink) {
      const link = document.createElement('link')
      link.href = fontUrl
      link.rel = 'stylesheet'
      document.head.appendChild(link)

      // Wait for font to load
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    addFont(fontName)
    setLoadingFont(null)
  }

  // Load installed fonts on mount
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

  const filteredFonts = popularJapaneseFonts.filter((f) =>
    f.name.toLowerCase().includes(fontSearch.toLowerCase())
  )

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings2 className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Reader Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Typography Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </h3>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Font Size</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateSettings({
                      fontSize: Math.max(14, settings.fontSize - 2),
                    })
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-16 text-center font-mono">
                  {settings.fontSize}px
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateSettings({
                      fontSize: Math.min(64, settings.fontSize + 2),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Line Height
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateSettings({
                      lineHeight: Math.max(1.2, settings.lineHeight - 0.2),
                    })
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-16 text-center font-mono">
                  {settings.lineHeight.toFixed(1)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateSettings({
                      lineHeight: Math.min(4, settings.lineHeight + 0.2),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Font</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(value) => updateSettings({ fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {installedFonts.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Font */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Add Google Font
              </Label>
              <Input
                placeholder="Search fonts..."
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                className="h-9"
              />
              {fontSearch && (
                <div className="max-h-40 overflow-y-auto rounded-md border bg-popover p-1">
                  {filteredFonts.length === 0 ? (
                    <p className="py-2 text-center text-sm text-muted-foreground">
                      No fonts found
                    </p>
                  ) : (
                    filteredFonts.map((font) => {
                      const isInstalled = installedFonts.includes(font.name)
                      const isLoading = loadingFont === font.name
                      return (
                        <button
                          key={font.name}
                          className={cn(
                            'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm',
                            'hover:bg-accent',
                            isInstalled && 'text-muted-foreground'
                          )}
                          onClick={() => !isInstalled && loadGoogleFont(font.name)}
                          disabled={isInstalled || isLoading}
                        >
                          <span>{font.name}</span>
                          {isInstalled ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : isLoading ? (
                            <Download className="h-4 w-4 animate-pulse" />
                          ) : (
                            <Download className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Display Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Display
            </h3>

            {/* Furigana Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Furigana</Label>
                <p className="text-xs text-muted-foreground">
                  Display readings above kanji
                </p>
              </div>
              <Switch
                checked={settings.showFurigana}
                onCheckedChange={(checked) =>
                  updateSettings({ showFurigana: checked })
                }
              />
            </div>

            {/* Color by POS Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Color by Part of Speech</Label>
                <p className="text-xs text-muted-foreground">
                  Different colors for verbs, nouns, etc.
                </p>
              </div>
              <Switch
                checked={settings.colorByPos}
                onCheckedChange={(checked) =>
                  updateSettings({ colorByPos: checked })
                }
              />
            </div>
          </section>

          {/* POS Colors Section */}
          {settings.colorByPos && (
            <section className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Part of Speech Colors
              </h3>

              <div className="grid gap-3">
                {(Object.keys(posColorLabels) as Array<keyof PosColors>).map(
                  (pos) => (
                    <div
                      key={pos}
                      className="flex items-center justify-between"
                    >
                      <Label className="text-sm">{posColorLabels[pos]}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={
                            settings.posColors[pos] === 'inherit'
                              ? '#888888'
                              : settings.posColors[pos]
                          }
                          onChange={(e) => updatePosColor(pos, e.target.value)}
                          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                        />
                        {pos === 'default' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updatePosColor(pos, 'inherit')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Color Preview */}
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <p className="text-lg leading-relaxed">
                  <span style={{ color: settings.posColors.noun }}>猫</span>
                  <span style={{ color: settings.posColors.particle }}>が</span>
                  <span style={{ color: settings.posColors.adverb }}>
                    ゆっくり
                  </span>
                  <span style={{ color: settings.posColors.verb }}>歩いて</span>
                  <span style={{ color: settings.posColors.default }}>いる</span>
                  。
                </p>
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
