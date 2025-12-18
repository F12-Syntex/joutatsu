'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from './sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [bgUrl, setBgUrl] = useState<string | null>(null)

  useEffect(() => {
    // Load background from settings
    const saved = localStorage.getItem('theme-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        setBgUrl(settings.backgroundUrl || null)
      } catch {
        // ignore
      }
    }

    // Listen for storage changes
    const handleStorage = () => {
      const s = localStorage.getItem('theme-settings')
      if (s) {
        try {
          const settings = JSON.parse(s)
          setBgUrl(settings.backgroundUrl || null)
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('storage', handleStorage)

    // Also listen for custom event for same-tab updates
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setBgUrl(detail?.backgroundUrl || null)
    }
    window.addEventListener('theme-change', handleCustom)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('theme-change', handleCustom)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Image */}
      {bgUrl && (
        <div
          id="theme-background"
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}

      <Sidebar />
      <main className="pl-64 relative z-10">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
