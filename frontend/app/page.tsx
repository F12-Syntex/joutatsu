'use client'

import Link from 'next/link'
import { BookOpen, Library, Upload, ArrowRight } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { QuickReader } from '@/components/reader/quick-reader'

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Reading Practice</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Practice reading Japanese with instant dictionary lookup
          </p>
        </div>

        {/* Quick Reader - Main Feature */}
        <div className="mb-8">
          <QuickReader />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/reader">
              <BookOpen className="h-4 w-4 mr-2" />
              Open Reader
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/library">
              <Library className="h-4 w-4 mr-2" />
              Browse Library
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/library">
              <Upload className="h-4 w-4 mr-2" />
              Import Text
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
