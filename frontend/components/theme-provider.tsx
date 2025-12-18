'use client'

import * as React from 'react'
import { useEffect } from 'react'

interface ThemeSettings {
  mode: 'light' | 'dark'
  accent: string
  backgroundUrl: string | null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize theme from localStorage
    const saved = localStorage.getItem('theme-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved) as ThemeSettings
        document.documentElement.setAttribute('data-mode', settings.mode)
        document.documentElement.setAttribute('data-accent', settings.accent)
      } catch {
        document.documentElement.setAttribute('data-mode', 'dark')
        document.documentElement.setAttribute('data-accent', 'blue')
      }
    } else {
      document.documentElement.setAttribute('data-mode', 'dark')
      document.documentElement.setAttribute('data-accent', 'blue')
    }
  }, [])

  return <>{children}</>
}
