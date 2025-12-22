'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Library,
  Settings,
  BarChart3,
  Home,
  GraduationCap,
  Video,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { ThemeSelector } from '@/components/theme-selector'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Reader',
    href: '/reader',
    icon: BookOpen,
  },
  {
    title: 'Library',
    href: '/library',
    icon: Library,
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: BarChart3,
  },
  {
    title: 'Study',
    href: '/study',
    icon: GraduationCap,
  },
  {
    title: 'Watch',
    href: '/watch',
    icon: Video,
  },
]

const bottomNavItems: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-sidebar/80 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg transition-transform group-hover:scale-105">
              上
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight">Joutatsu</span>
              <p className="text-xs text-muted-foreground">Japanese Learning</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border/50 px-3 py-4 space-y-1">
          {/* Theme Selector */}
          <ThemeSelector />

          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
