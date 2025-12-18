'use client'

import Link from 'next/link'
import { Database, BookOpen, FileText, Microscope } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const devPages = [
  {
    title: 'Read',
    description: 'Japanese reading canvas with tokenization and tooltips',
    href: '/dev/read',
    icon: BookOpen,
  },
  {
    title: 'Library',
    description: 'Content management and import',
    href: '/dev/library',
    icon: FileText,
  },
  {
    title: 'Explore',
    description: 'Data explorer for content, dictionary, tokenization, and pitch',
    href: '/dev/explore',
    icon: Microscope,
  },
  {
    title: 'Database',
    description: 'Database explorer and search tools',
    href: '/dev/database',
    icon: Database,
  },
]

export default function DevIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dev Pages</h1>
          <p className="text-muted-foreground mt-2">
            Development and testing pages for Joutatsu features
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {devPages.map((page) => (
            <Link key={page.href} href={page.href}>
              <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <page.icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{page.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
