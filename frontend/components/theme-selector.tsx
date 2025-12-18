'use client'

import { useEffect, useState, useCallback } from 'react'
import { Check, Sun, Moon, Shuffle, X, Heart, ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type Mode = 'light' | 'dark'
type Accent = 'blue' | 'violet' | 'emerald' | 'rose' | 'orange' | 'cyan'

interface ThemeSettings {
  mode: Mode
  accent: Accent
  backgroundUrl: string | null
  savedBackgrounds: string[]
}

const accents: { id: Accent; name: string; color: string }[] = [
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
  { id: 'orange', name: 'Orange', color: '#f59e0b' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
]

const defaultSettings: ThemeSettings = {
  mode: 'dark',
  accent: 'blue',
  backgroundUrl: null,
  savedBackgrounds: [],
}

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings)
  const [isLoadingBg, setIsLoadingBg] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ThemeSettings
        setSettings(parsed)
        applyTheme(parsed)
      } catch {
        applyTheme(defaultSettings)
      }
    } else {
      applyTheme(defaultSettings)
    }
  }, [])

  const applyTheme = (s: ThemeSettings) => {
    document.documentElement.setAttribute('data-mode', s.mode)
    document.documentElement.setAttribute('data-accent', s.accent)

    // Apply background
    const bgElement = document.getElementById('theme-background')
    if (bgElement) {
      if (s.backgroundUrl) {
        bgElement.style.backgroundImage = `url(${s.backgroundUrl})`
        bgElement.style.opacity = '1'
      } else {
        bgElement.style.backgroundImage = ''
        bgElement.style.opacity = '0'
      }
    }
  }

  const updateSettings = useCallback((updates: Partial<ThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem('theme-settings', JSON.stringify(next))
      applyTheme(next)
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('theme-change', { detail: next }))
      return next
    })
  }, [])

  const fetchRandomBackground = useCallback(async () => {
    setIsLoadingBg(true)
    try {
      // pic.re redirects to the actual image, we need to follow it
      const response = await fetch('https://pic.re/image', {
        method: 'HEAD',
        redirect: 'follow'
      })
      const imageUrl = response.url
      updateSettings({ backgroundUrl: imageUrl })
    } catch (error) {
      console.error('Failed to fetch background:', error)
      // Fallback: use the URL directly and let the browser handle redirect
      updateSettings({ backgroundUrl: 'https://pic.re/image?' + Date.now() })
    } finally {
      setIsLoadingBg(false)
    }
  }, [updateSettings])

  const saveCurrentBackground = useCallback(() => {
    if (settings.backgroundUrl && !settings.savedBackgrounds.includes(settings.backgroundUrl)) {
      updateSettings({
        savedBackgrounds: [...settings.savedBackgrounds, settings.backgroundUrl],
      })
    }
  }, [settings.backgroundUrl, settings.savedBackgrounds, updateSettings])

  const removeBackground = useCallback(() => {
    updateSettings({ backgroundUrl: null })
  }, [updateSettings])

  const removeSavedBackground = useCallback((url: string) => {
    updateSettings({
      savedBackgrounds: settings.savedBackgrounds.filter((bg) => bg !== url),
    })
  }, [settings.savedBackgrounds, updateSettings])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-3">
        <div className="h-4 w-4 rounded-full bg-primary" />
        <span>Theme</span>
      </Button>
    )
  }

  const currentAccent = accents.find((a) => a.id === settings.accent) || accents[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <div
            className="h-4 w-4 rounded-full border border-border/50"
            style={{ background: currentAccent.color }}
          />
          <span>Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        side="right"
        align="end"
        sideOffset={8}
      >
        <div className="p-3 space-y-4">
          {/* Mode Toggle */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Mode</p>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ mode: 'light' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all',
                  settings.mode === 'light'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => updateSettings({ mode: 'dark' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all',
                  settings.mode === 'dark'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Accent Colors */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Accent</p>
            <div className="flex flex-wrap gap-2">
              {accents.map((accent) => (
                <button
                  key={accent.id}
                  onClick={() => updateSettings({ accent: accent.id })}
                  className={cn(
                    'relative h-8 w-8 rounded-full transition-all hover:scale-110',
                    settings.accent === accent.id && 'ring-2 ring-offset-2 ring-offset-background ring-current'
                  )}
                  style={{
                    background: accent.color,
                    color: accent.color,
                  }}
                  title={accent.name}
                >
                  {settings.accent === accent.id && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Background</p>

            {/* Current background preview */}
            {settings.backgroundUrl && (
              <div className="relative rounded-lg overflow-hidden h-20 bg-secondary">
                <img
                  src={settings.backgroundUrl}
                  alt="Current background"
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <Button
                    size="icon-xs"
                    variant="secondary"
                    onClick={saveCurrentBackground}
                    title="Save to favorites"
                    className="h-7 w-7"
                  >
                    <Heart className={cn("h-3.5 w-3.5", settings.savedBackgrounds.includes(settings.backgroundUrl) && "fill-current")} />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="secondary"
                    onClick={removeBackground}
                    title="Remove background"
                    className="h-7 w-7"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRandomBackground}
                disabled={isLoadingBg}
                className="flex-1"
              >
                <Shuffle className={cn("h-4 w-4 mr-2", isLoadingBg && "animate-spin")} />
                Random
              </Button>
              {!settings.backgroundUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  None
                </Button>
              )}
            </div>

            {/* Saved backgrounds */}
            {settings.savedBackgrounds.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  Saved ({settings.savedBackgrounds.length})
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {settings.savedBackgrounds.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => updateSettings({ backgroundUrl: url })}
                      className={cn(
                        'relative h-10 w-10 rounded-md overflow-hidden border-2 transition-all hover:scale-105',
                        settings.backgroundUrl === url
                          ? 'border-primary'
                          : 'border-transparent'
                      )}
                    >
                      <img
                        src={url}
                        alt={`Saved ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSavedBackground(url)
                        }}
                        className="absolute top-0 right-0 p-0.5 bg-black/50 rounded-bl opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5 text-white" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
